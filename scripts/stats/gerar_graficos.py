"""Gera os gráficos de monitoramento exibidos no README.

- stars.svg     : histórico acumulado de estrelas do repositório
- atividade.svg : commits na branch principal e PRs mergeados (acumulados)

Os dados são reconstruídos a cada execução a partir da API do GitHub
(não há estado persistido). Executado pelo workflow .github/workflows/stats.yml.

Uso:
    GH_TOKEN=... GITHUB_REPOSITORY=dono/repo python scripts/stats/gerar_graficos.py <dir-saida>
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.dates as mdates  # noqa: E402
import matplotlib.pyplot as plt  # noqa: E402

matplotlib.rcParams["svg.hashsalt"] = "biblia-app"  # SVG determinístico
matplotlib.rcParams["font.family"] = "DejaVu Sans"

API = "https://api.github.com"
COR_PRIMARIA = "#2c5282"
COR_SECUNDARIA = "#dd6b20"
COR_PREENCHIMENTO = "#e8ecf2"
JANELA_MINIMA = timedelta(days=14)  # evita eixo X de poucas horas em repositório novo


# --------------------------------------------------------------------------- API
def _get(url: str, accept: str = "application/vnd.github+json") -> tuple[list | dict, str | None]:
    req = urllib.request.Request(url)
    req.add_header("Accept", accept)
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("User-Agent", "biblia-app-stats")
    token = os.environ.get("GH_TOKEN")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        proximo = None
        for parte in resp.headers.get("Link", "").split(","):
            if 'rel="next"' in parte:
                proximo = parte[parte.find("<") + 1 : parte.find(">")]
        return json.load(resp), proximo


def _paginar(url: str, accept: str = "application/vnd.github+json") -> list:
    itens: list = []
    while url:
        dados, url = _get(url, accept)
        itens.extend(dados)
    return itens


def _data(iso: str) -> datetime:
    return datetime.fromisoformat(iso.replace("Z", "+00:00"))


def _inicio(repo: dict, agora: datetime) -> datetime:
    return min(_data(repo["created_at"]), agora - JANELA_MINIMA)


def _acumulado(datas: list[datetime], inicio: datetime, fim: datetime) -> tuple[list, list]:
    """Série em degraus: começa em 0 no início, +1 a cada evento, mantém até o fim."""
    datas = sorted(datas)
    xs, ys = [inicio], [0]
    for i, d in enumerate(datas, start=1):
        xs.append(d)
        ys.append(i)
    xs.append(fim)
    ys.append(len(datas))
    return xs, ys


# ------------------------------------------------------------------------ estilo
def _estilo(ax, titulo: str, ylabel: str) -> None:
    ax.set_title(titulo, loc="left", fontsize=17, color="#1a1a1a", pad=12)
    ax.set_ylabel(ylabel, fontsize=15, color="#333333")
    ax.grid(False)
    for spine in ax.spines.values():
        spine.set_color("#c9c9c9")
        spine.set_linewidth(0.8)
    ax.tick_params(colors="#444444", labelsize=12, length=3)
    for label in ax.get_xticklabels() + ax.get_yticklabels():
        label.set_fontfamily("monospace")
    ax.set_ylim(bottom=0)
    ax.yaxis.get_major_locator().set_params(integer=True)


def _eixo_tempo(ax, inicio: datetime, fim: datetime) -> None:
    dias = (fim - inicio).days
    if dias <= 120:
        ax.xaxis.set_major_locator(mdates.AutoDateLocator(minticks=3, maxticks=6))
        ax.xaxis.set_major_formatter(mdates.DateFormatter("%d/%m"))
    elif dias <= 730:
        ax.xaxis.set_major_locator(mdates.MonthLocator(interval=max(1, dias // 180)))
        ax.xaxis.set_major_formatter(mdates.DateFormatter("%m/%y"))
    else:
        ax.xaxis.set_major_locator(mdates.YearLocator())
        ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))
    ax.set_xlim(inicio, fim)


def _salvar(fig, caminho: Path) -> None:
    fig.tight_layout()
    fig.savefig(caminho, format="svg", metadata={"Date": None})
    plt.close(fig)


# ---------------------------------------------------------------------- gráficos
def grafico_estrelas(repo: dict, saida: Path, agora: datetime) -> int:
    estrelas = _paginar(
        f"{API}/repos/{repo['full_name']}/stargazers?per_page=100",
        accept="application/vnd.github.star+json",
    )
    datas = [_data(e["starred_at"]) for e in estrelas]
    inicio = _inicio(repo, agora)
    xs, ys = _acumulado(datas, inicio, agora)

    fig, ax = plt.subplots(figsize=(7, 5))
    ax.step(xs, ys, where="post", color=COR_PRIMARIA, lw=2)
    ax.fill_between(xs, ys, step="post", color=COR_PREENCHIMENTO)
    _estilo(ax, "Histórico de estrelas", "Estrelas")
    _eixo_tempo(ax, inicio, agora)
    ax.set_ylim(0, max(5, len(datas) * 1.1))
    if not datas:
        ax.text(0.5, 0.5, "Nenhuma estrela ainda", transform=ax.transAxes,
                ha="center", va="center", fontsize=13, color="#888888")
    _salvar(fig, saida / "stars.svg")
    return len(datas)


def grafico_atividade(repo: dict, saida: Path, agora: datetime) -> tuple[int, int]:
    nome, branch = repo["full_name"], repo["default_branch"]
    commits = _paginar(f"{API}/repos/{nome}/commits?sha={branch}&per_page=100")
    datas_commits = [_data(c["commit"]["committer"]["date"]) for c in commits]
    prs = _paginar(f"{API}/repos/{nome}/pulls?state=closed&per_page=100")
    datas_prs = [_data(p["merged_at"]) for p in prs if p.get("merged_at")]

    inicio = _inicio(repo, agora)
    fig, ax = plt.subplots(figsize=(7, 5))
    for datas, cor, rotulo in (
        (datas_commits, COR_PRIMARIA, "Commits"),
        (datas_prs, COR_SECUNDARIA, "PRs mergeados"),
    ):
        xs, ys = _acumulado(datas, inicio, agora)
        ax.step(xs, ys, where="post", color=cor, lw=2, label=rotulo)
        ax.plot(sorted(datas), range(1, len(datas) + 1), "o", ms=3.5, color=cor)
    _estilo(ax, "Atividade do projeto", "Total acumulado")
    _eixo_tempo(ax, inicio, agora)
    ax.set_ylim(0, max(5, len(datas_commits) * 1.15))
    ax.legend(loc="upper left", frameon=False, fontsize=11, labelcolor="#333333")
    _salvar(fig, saida / "atividade.svg")
    return len(datas_commits), len(datas_prs)


def main() -> None:
    nome = os.environ.get("GITHUB_REPOSITORY", "edioilha/biblia-app")
    saida = Path(sys.argv[1] if len(sys.argv) > 1 else "stats")
    saida.mkdir(parents=True, exist_ok=True)
    agora = datetime.now(timezone.utc)

    repo, _ = _get(f"{API}/repos/{nome}")
    n_estrelas = grafico_estrelas(repo, saida, agora)
    n_commits, n_prs = grafico_atividade(repo, saida, agora)
    print(f"{nome}: {n_estrelas} estrelas, {n_commits} commits, {n_prs} PRs mergeados → {saida}/")


if __name__ == "__main__":
    main()
