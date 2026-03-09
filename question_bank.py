"""Question Bank module — loads DSA questions from CollatedMockQuestions.pdf.

On first import the PDF is parsed and questions are cached in a JSON sidecar
file (question_bank_cache.json) next to the PDF so subsequent loads are instant.

Public API
----------
get_random_question(difficulty, topic, previous_questions, skills)
    → dict  with keys: title, description, examples, constraints, hints,
            expected_approach, time_complexity, space_complexity, topic_tags,
            difficulty, starter_code_python, solution_code
get_all_questions()          → list[dict]
get_topics()                 → list[str]
get_questions_by_topic(topic) → list[dict]
"""

import json
import os
import random
import re
from pathlib import Path
from typing import List, Optional

# ── Locate the PDF ────────────────────────────────────────────────────────────
_THIS_DIR = Path(__file__).resolve().parent
_PDF_PATH = _THIS_DIR / "CollatedMockQuestions.pdf"
_CACHE_PATH = _THIS_DIR / "question_bank_cache.json"

# ── Internal question store ───────────────────────────────────────────────────
_questions: List[dict] = []


# ── PDF Parser ────────────────────────────────────────────────────────────────

def _parse_pdf(pdf_path: str) -> List[dict]:
    """Parse the CollatedMockQuestions PDF into structured question dicts."""
    try:
        import PyPDF2
    except ImportError:
        # Fallback — try pypdf
        try:
            from pypdf import PdfReader as _Reader
        except ImportError:
            print("[question_bank] WARNING: PyPDF2/pypdf not installed. "
                  "Run: pip install PyPDF2")
            return []
        reader = _Reader(pdf_path)
        full_text = ""
        for page in reader.pages:
            full_text += (page.extract_text() or "") + "\n"
    else:
        reader = PyPDF2.PdfReader(pdf_path)
        full_text = ""
        for page in reader.pages:
            full_text += (page.extract_text() or "") + "\n"

    # Split into chunks by numbered question pattern: "N. Title..."
    chunks = re.split(r'\n(?=\d{1,2}\s*[\.\)]\s*[A-Z])', full_text)

    questions = []
    seen_titles = set()

    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue

        # Extract question number and first line
        m = re.match(r'^(\d{1,2})\s*[\.\)]\s*(.+?)(?:\n|$)', chunk)
        if not m:
            continue

        first_line = m.group(2).strip()

        # Build title
        title_match = re.match(r'^(.+?)(?:\s*Problem Statement\s*:?\s*$|\s*$)', first_line)
        title = title_match.group(1).strip() if title_match else first_line.strip()
        if len(title) > 120:
            title = title.split('.')[0].strip()[:120]

        # Skip fragments / non-questions
        if len(title) < 15 or title[0].islower():
            continue
        skip_starts = ('Every house with', 'The first line', 'If two characters',
                       'No two adjacent', 'Any of these')
        if any(title.startswith(s) for s in skip_starts):
            continue

        title_key = title.lower().strip()
        if title_key in seen_titles:
            continue

        desc_text = chunk[m.end():]

        # ── Examples ──────────────────────────────────────────────────────
        examples = []
        for pat in [
            r'(?:Example|Case)\s*#?\s*\d*\s*:?\s*\n\s*Input\s*:?\s*(.+?)Output\s*:?\s*(.+?)(?:Explanation|Example|Case|Constraint|Hint|Test|Code|\n\n)',
            r'Sample Input\s*\d*\s*:?\s*\n(.+?)Sample Output\s*\d*\s*:?\s*\n(.+?)(?:\n\n|Sample|Test|Code|Input \d|$)',
        ]:
            for inp, out in re.findall(pat, desc_text, re.DOTALL | re.IGNORECASE)[:3]:
                examples.append({
                    "input": inp.strip()[:300],
                    "output": out.strip()[:300],
                })
            if examples:
                break

        # ── Test cases ────────────────────────────────────────────────────
        test_cases = []
        for inp, out in re.findall(
            r'(?:Input|Test Case)\s*\d+\s*\n(.+?)Output\s*\d*\s*\n(.+?)(?:\n\n|\nInput|\nTest|Code|\Z)',
            desc_text, re.DOTALL | re.IGNORECASE
        )[:8]:
            test_cases.append({
                "input": inp.strip()[:300],
                "output": out.strip()[:300],
            })

        # ── Solution code ─────────────────────────────────────────────────
        code = ""
        code_match = re.search(r'\nCode\s*\n(.+?)(?:\n\d+\.\s|\Z)', desc_text, re.DOTALL)
        if code_match:
            code = code_match.group(1).strip()[:3000]

        # ── Constraints ───────────────────────────────────────────────────
        constraints = []
        const_match = re.search(
            r'Constraints?\s*:?\s*\n(.+?)(?:\n\n|Example|Case|Input|Hint|Code|$)',
            desc_text, re.DOTALL | re.IGNORECASE)
        if const_match:
            for line in const_match.group(1).strip().split('\n'):
                line = line.strip().lstrip('•-* ')
                if line and len(line) > 3:
                    constraints.append(line[:200])

        # ── Hints ─────────────────────────────────────────────────────────
        hints = []
        hint_match = re.search(
            r'Hint\s*:?\s*\n(.+?)(?:\n\n|Code|Test|$)',
            desc_text, re.DOTALL | re.IGNORECASE)
        if hint_match:
            for line in hint_match.group(1).strip().split('\n'):
                line = line.strip().lstrip('•-* ')
                if line and len(line) > 5:
                    hints.append(line[:300])

        # ── Clean description ─────────────────────────────────────────────
        clean_desc = desc_text
        for marker in ('\nCode\n', '\nTest Cases\n', '\nTest Cases \n'):
            idx = clean_desc.find(marker)
            if idx > 0:
                clean_desc = clean_desc[:idx]
        clean_desc = clean_desc.strip()[:2000]
        if len(clean_desc) < 30:
            continue

        # ── Difficulty heuristic ──────────────────────────────────────────
        combined_lower = (title + " " + clean_desc).lower()
        if any(kw in combined_lower for kw in
               ['dp ', 'dynamic programming', 'backtrack', "knight's tour",
                'palindromic subsequence', 'knapsack', 'minimum cost']):
            difficulty = "hard"
        elif any(kw in combined_lower for kw in
                 ['peak element', 'two sum', 'valid parenthes', 'stack',
                  'largest sum', 'sort', 'minimum element']):
            difficulty = "easy"
        else:
            difficulty = "medium"

        # ── Topic tags ────────────────────────────────────────────────────
        tag_map = {
            "Array": ["array", "subarray", "nums", "element", "subset"],
            "String": ["string", "substring", "character", "palindrom", "anagram"],
            "Stack": ["stack", "push", "pop", "bracket", "parenthes"],
            "Queue": ["queue", "deque"],
            "Linked List": ["linked list", "node", "pointer"],
            "Tree": ["tree", "binary tree", "bst", "root", "leaf"],
            "Graph": ["graph", "vertex", "edge", "dfs", "bfs", "shortest path"],
            "Dynamic Programming": ["dp", "dynamic programming", "memoiz",
                                     "tabulation", "lcs", "knapsack", "rod cutting"],
            "Greedy": ["greedy", "maximize", "minimize", "optimal", "schedule"],
            "Binary Search": ["binary search", "log n"],
            "Recursion": ["recursion", "recursive", "backtrack"],
            "Sorting": ["sort", "merge sort", "quick sort", "order"],
            "Hash Table": ["hash", "map", "dictionary", "frequency", "count"],
            "Matrix": ["matrix", "grid", "2d array", "chessboard"],
            "Sliding Window": ["window", "sliding"],
            "Two Pointers": ["two pointer"],
            "Bit Manipulation": ["bit manipulation", "xor", "bitwise"],
            "Math": ["gcd", "prime", "factorial", "modulo", "fibonacci"],
        }
        tags = []
        for tag, keywords in tag_map.items():
            if any(kw in combined_lower for kw in keywords):
                tags.append(tag)
        if not tags:
            tags = ["General"]

        # ── Build question dict ───────────────────────────────────────────
        seen_titles.add(title_key)
        questions.append({
            "title": title[:120],
            "description": clean_desc,
            "examples": examples[:3],
            "test_cases": test_cases[:8],
            "constraints": constraints[:5],
            "hints": hints[:3],
            "solution_code": code,
            "difficulty": difficulty,
            "topic_tags": tags[:4],
            # Fields expected by the DSA interview page
            "expected_approach": "",
            "time_complexity": "",
            "space_complexity": "",
            "starter_code_python": "",
        })

    return questions


# ── Load / Cache ──────────────────────────────────────────────────────────────

def _load_questions() -> List[dict]:
    """Load questions from cache or parse PDF fresh."""
    global _questions
    if _questions:
        return _questions

    # Try cache first
    if _CACHE_PATH.exists():
        try:
            with open(_CACHE_PATH, "r") as f:
                _questions = json.load(f)
            if _questions:
                return _questions
        except Exception:
            pass

    # Parse PDF
    if not _PDF_PATH.exists():
        print(f"[question_bank] WARNING: PDF not found at {_PDF_PATH}")
        return []

    _questions = _parse_pdf(str(_PDF_PATH))

    # Save cache
    try:
        with open(_CACHE_PATH, "w") as f:
            json.dump(_questions, f)
    except Exception:
        pass

    return _questions


# ── Public API ────────────────────────────────────────────────────────────────

def get_all_questions() -> List[dict]:
    """Return all parsed questions."""
    return _load_questions()


def get_topics() -> List[str]:
    """Return sorted list of unique topic tags."""
    topics = set()
    for q in _load_questions():
        for t in q.get("topic_tags", []):
            topics.add(t)
    return sorted(topics)


def get_questions_by_topic(topic: str) -> List[dict]:
    """Return all questions matching a topic tag (case-insensitive)."""
    topic_lower = topic.lower()
    return [q for q in _load_questions()
            if any(t.lower() == topic_lower for t in q.get("topic_tags", []))]


def get_questions_by_difficulty(difficulty: str) -> List[dict]:
    """Return all questions matching a difficulty level."""
    return [q for q in _load_questions() if q.get("difficulty") == difficulty]


def get_random_question(
    difficulty: str = "medium",
    topic: Optional[str] = None,
    previous_questions: Optional[List[str]] = None,
    skills: Optional[List[str]] = None,
) -> Optional[dict]:
    """Pick a random question from the PDF bank, filtered by criteria.

    Parameters
    ----------
    difficulty : str
        "easy", "medium", or "hard"
    topic : str | None
        If given, only pick questions matching this topic tag.
    previous_questions : list[str] | None
        Titles of already-asked questions to avoid repeats.
    skills : list[str] | None
        Candidate skills — used to prefer matching topic tags.

    Returns
    -------
    dict | None
        A question dict, or None if no matching question found.
    """
    all_qs = _load_questions()
    if not all_qs:
        return None

    prev_titles = set()
    if previous_questions:
        prev_titles = {t.lower().strip() for t in previous_questions}

    # Filter by difficulty
    pool = [q for q in all_qs if q.get("difficulty") == difficulty]
    if not pool:
        pool = list(all_qs)  # fallback to all

    # Filter by topic if given
    if topic:
        topic_lower = topic.lower()
        topic_pool = [q for q in pool
                      if any(t.lower() == topic_lower for t in q.get("topic_tags", []))]
        if topic_pool:
            pool = topic_pool

    # Exclude previously asked questions
    if prev_titles:
        filtered = [q for q in pool if q["title"].lower().strip() not in prev_titles]
        if filtered:
            pool = filtered

    # If skills are given, prefer questions whose tags overlap with skills
    if skills and len(pool) > 1:
        skill_lower = {s.lower() for s in skills}
        scored = []
        for q in pool:
            overlap = sum(1 for t in q.get("topic_tags", [])
                          if any(sk in t.lower() for sk in skill_lower))
            scored.append((overlap, q))
        scored.sort(key=lambda x: x[0], reverse=True)
        # Take top half by relevance, then pick randomly from those
        top_half = scored[:max(len(scored) // 2, 5)]
        pool = [q for _, q in top_half]

    if not pool:
        return None

    return random.choice(pool)


# ── Auto-load on import ──────────────────────────────────────────────────────
_load_questions()
