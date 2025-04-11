from itertools import combinations
import numpy as np

def generate_flushes(ranks):
    flushes = [
        {
            "score": 4 * (35 + sum(hand)),
            "hand": ",".join(map(str, hand))
        }
        for hand in combinations(ranks, 5)
    ]
    return flushes

def calculate_percentage(flushes):
    total = len(flushes)
    viable = sum(1 for f in flushes if f["score"] > 300)
    print(f"Viable flushes: {viable / total * 100:.2f}%")
    
    scores = [f["score"] for f in flushes]
    median_score = np.median(scores)
    print(f"Median flush score: {median_score}")

def main():
    ranks = [11, 10, 10, 10, 10, 9, 8, 7, 6, 5, 4, 3, 2]
    flushes = generate_flushes(ranks)
    calculate_percentage(flushes)

if __name__ == "__main__":
    main()
