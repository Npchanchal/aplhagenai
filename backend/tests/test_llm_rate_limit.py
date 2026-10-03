"""Process-wide LLM rate limit (INTELLENS_LLM_RATE_PER_MIN)."""

import pytest

from app.services import llm_client


class FakeClock:
    def __init__(self) -> None:
        self.now = 1000.0
        self.slept: list = []

    def __call__(self) -> float:
        return self.now

    def sleep(self, seconds: float) -> None:
        self.slept.append(seconds)
        self.now += seconds


@pytest.fixture
def clock(monkeypatch):
    monkeypatch.setenv("INTELLENS_LLM_RATE_PER_MIN", "4")
    llm_client.reset_rate_limit()
    yield FakeClock()
    llm_client.reset_rate_limit()


def _acquire(clock, wait=True):
    llm_client._acquire_slot(wait=wait, clock=clock, sleep=clock.sleep)


def test_four_calls_pass_then_fifth_waits_for_oldest_to_age_out(clock):
    for _ in range(4):
        _acquire(clock)
        clock.now += 5
    assert clock.slept == []
    _acquire(clock)
    assert clock.slept == [pytest.approx(40.0)]


def test_interactive_call_fails_fast_when_full(clock):
    for _ in range(4):
        _acquire(clock)
    with pytest.raises(llm_client.LLMRateLimited):
        _acquire(clock, wait=False)
    assert clock.slept == []


def test_window_frees_after_a_minute(clock):
    for _ in range(4):
        _acquire(clock)
    clock.now += 60
    _acquire(clock, wait=False)
    assert clock.slept == []


def test_zero_disables_limit(clock, monkeypatch):
    monkeypatch.setenv("INTELLENS_LLM_RATE_PER_MIN", "0")
    for _ in range(50):
        _acquire(clock, wait=False)


def test_post_json_counts_against_limit(clock, monkeypatch):
    monkeypatch.setenv("INTELLENS_LLM_API_KEY", "k")
    for _ in range(4):
        llm_client._acquire_slot(wait=False)
    with pytest.raises(llm_client.LLMRateLimited):
        llm_client._post_json("/chat/completions", {}, wait=False)


def test_research_rewrite_falls_back_when_limited(clock, monkeypatch):
    monkeypatch.setenv("INTELLENS_LLM_API_KEY", "k")
    for _ in range(4):
        llm_client._acquire_slot(wait=False)
    with pytest.raises(llm_client.LLMRateLimited):
        llm_client.rewrite_cite_only_answer("q", ["snippet"])
