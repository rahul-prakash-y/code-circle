import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import CodingChallenge from '../models/codingChallengeModel';

async function seed() {
  await connectDB();
  console.log('[Seed] Connected to MongoDB');

  const existing = await CodingChallenge.findOne({ title: 'Two Sum Target Indices' });
  if (existing) {
    console.log('[Seed] Challenge already exists with ID:', existing._id.toString());
    process.exit(0);
  }

  const starterCode = new Map<string, string>();

  starterCode.set(
    'python',
    `import sys

def two_sum(nums, target):
    # Return two space-separated indices whose values sum to target
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return f"{seen[complement]} {i}"
        seen[num] = i
    return "-1 -1"

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    target = int(lines[1])
    nums = [int(x) for x in lines[2:2+n]]
    print(two_sum(nums, target))

if __name__ == '__main__':
    main()
`
  );

  starterCode.set(
    'javascript',
    `const fs = require('fs');

function solve() {
  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
  if (!input || input.length < 2) return;
  const n = parseInt(input[0], 10);
  const target = parseInt(input[1], 10);
  const nums = input.slice(2, 2 + n).map(Number);

  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (seen.has(comp)) {
      console.log(\`\${seen.get(comp)} \${i}\`);
      return;
    }
    seen.set(nums[i], i);
  }
  console.log("-1 -1");
}

solve();
`
  );

  starterCode.set(
    'cpp',
    `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, target;
    if (!(cin >> n >> target)) return 0;

    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }

    unordered_map<int, int> seen;
    for (int i = 0; i < n; i++) {
        int comp = target - nums[i];
        if (seen.find(comp) != seen.end()) {
            cout << seen[comp] << " " << i << "\\n";
            return 0;
        }
        seen[nums[i]] = i;
    }

    cout << "-1 -1\\n";
    return 0;
}
`
  );

  starterCode.set(
    'c',
    `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n, target;
    if (scanf("%d %d", &n, &target) != 2) return 0;

    int *nums = (int *)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        scanf("%d", &nums[i]);
    }

    // Direct search for smaller N in C
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (nums[i] + nums[j] == target) {
                printf("%d %d\\n", i, j);
                free(nums);
                return 0;
            }
        }
    }

    printf("-1 -1\\n");
    free(nums);
    return 0;
}
`
  );

  starterCode.set(
    'java',
    `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int target = sc.nextInt();

        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }

        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < n; i++) {
            int comp = target - nums[i];
            if (map.containsKey(comp)) {
                System.out.println(map.get(comp) + " " + i);
                return;
            }
            map.put(nums[i], i);
        }

        System.out.println("-1 -1");
    }
}
`
  );

  const challenge = new CodingChallenge({
    title: 'Two Sum Target Indices',
    description:
      'Given an array of integers `nums` and an integer `target`, return the 0-indexed positions of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    inputFormat:
      'The first line contains two space-separated integers `n` (number of elements) and `target`.\nThe second line contains `n` space-separated integers representing `nums`.',
    outputFormat:
      'Print two space-separated integers representing the indices in ascending order.',
    constraints:
      '2 <= n <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nExactly one valid answer exists.',
    sampleInput: '4 9\n2 7 11 15',
    sampleOutput: '0 1',
    difficulty: 'Easy',
    allowedLanguages: ['c', 'cpp', 'python', 'java', 'javascript'],
    starterCode,
    timeLimitMinutes: 45,
    singleSubmissionOnly: true,
    isPublished: true,
    testCases: [
      // Visible Test Case 1
      {
        input: '4 9\n2 7 11 15\n',
        expectedOutput: '0 1',
        isHidden: false,
      },
      // Visible Test Case 2
      {
        input: '3 6\n3 2 4\n',
        expectedOutput: '1 2',
        isHidden: false,
      },
      // Visible Test Case 3
      {
        input: '2 6\n3 3\n',
        expectedOutput: '0 1',
        isHidden: false,
      },
      // Hidden Test Case 4 (Negative numbers)
      {
        input: '4 -1\n-3 4 3 90\n',
        expectedOutput: '0 2',
        isHidden: true,
      },
      // Hidden Test Case 5 (Larger array)
      {
        input: '5 100\n10 20 30 70 80\n',
        expectedOutput: '2 3',
        isHidden: true,
      },
    ],
  });

  await challenge.save();
  console.log('[Seed] Created Two Sum Challenge successfully with ID:', challenge._id.toString());
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
