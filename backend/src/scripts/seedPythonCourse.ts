import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import Domain from '../models/domainModel';
import Level from '../models/levelModel';
import CodingChallenge from '../models/codingChallengeModel';

/**
 * Seed script: Complete Python Programming (Zero to Hero)
 * 10 Progressive Levels:
 * 1. Python Foundations
 * 2. Variables, Data Types & Operators
 * 3. Conditions & Decision Making
 * 4. Loops & Problem Solving
 * 5. Strings & Collections
 * 6. Functions & Modular Programming
 * 7. Object-Oriented Programming
 * 8. Advanced Python & File/Data Handling
 * 9. APIs, Databases & Real-World Python
 * 10. Advanced Python, Algorithms & Professional Development
 */

async function seedPythonCourse() {
  await connectDB();
  console.log('[Seed] Connected to MongoDB');

  const courseTitle = 'Python Programming: Zero to Hero';

  // 1. Create or Find Domain
  let domain = await Domain.findOne({ name: courseTitle });
  if (!domain) {
    domain = await Domain.create({
      name: courseTitle,
      description:
        'A comprehensive 10-level interactive Python course taking students from absolute fundamentals to object-oriented programming, data handling, APIs, and competitive algorithms.',
      coverImageUrl:
        'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80',
      isLocked: false,
    });
    console.log(`[Seed] Created domain: "${courseTitle}" (${domain._id})`);
  } else {
    console.log(`[Seed] Found existing domain: "${courseTitle}" (${domain._id})`);
  }

  // Clear existing levels for this domain to ensure clean re-seeding
  await Level.deleteMany({ domainId: domain._id });
  console.log(`[Seed] Cleared existing levels for domain ${domain._id}`);

  // Define 10 Level Specs
  const levelsData = [
    {
      levelNumber: 1,
      title: 'Level 1: Python Foundations',
      youtubeVideoId: '_uQrJ0TkZlc', // Programming with Mosh Python tutorial
      challenge: {
        title: 'Level 1: Personal Profile Formatter',
        difficulty: 'Easy' as const,
        description:
          'Write a program that reads a user\'s first name, age, and favorite programming language, then prints a formatted bio string and calculates the age in months.',
        inputFormat: 'Three lines: Name (string), Age (integer), Favorite Language (string)',
        outputFormat: 'Two lines:\nLine 1: Hello <Name>! Welcome to Python.\nLine 2: You are <Age> years old (<Months> months) and you love <Language>.',
        constraints: '1 <= len(Name) <= 50\n1 <= Age <= 120',
        sampleInput: 'Alice\n20\nPython',
        sampleOutput: 'Hello Alice! Welcome to Python.\nYou are 20 years old (240 months) and you love Python.',
        starterCode: `import sys

def main():
    lines = [line.strip() for line in sys.stdin if line.strip()]
    if len(lines) < 3:
        return
    name = lines[0]
    age = int(lines[1])
    language = lines[2]
    
    # Write your solution here
    months = age * 12
    print(f"Hello {name}! Welcome to Python.")
    print(f"You are {age} years old ({months} months) and you love {language}.")

if __name__ == '__main__':
    main()
`,
        testCases: [
          {
            input: 'Alice\n20\nPython',
            expectedOutput: 'Hello Alice! Welcome to Python.\nYou are 20 years old (240 months) and you love Python.',
            isHidden: false,
          },
          {
            input: 'Bob\n25\nJavaScript',
            expectedOutput: 'Hello Bob! Welcome to Python.\nYou are 25 years old (300 months) and you love JavaScript.',
            isHidden: false,
          },
          {
            input: 'Charlie\n18\nC++',
            expectedOutput: 'Hello Charlie! Welcome to Python.\nYou are 18 years old (216 months) and you love C++.',
            isHidden: true,
          },
          {
            input: 'Diana\n32\nRust',
            expectedOutput: 'Hello Diana! Welcome to Python.\nYou are 32 years old (384 months) and you love Rust.',
            isHidden: true,
          },
        ],
      },
      studyMaterials: [
        {
          title: 'Python Core Syntax & Anatomy of a Script',
          type: 'notes' as const,
          content: `# Python Foundations Cheat Sheet\n\n- **Indentation**: Python uses 4 spaces instead of curly braces {}\n- **print()**: Output to console. Example: print("Hello", name)\n- **input()**: Reads string input from standard input\n- **Type Casting**: int("10"), float("3.14"), str(100)\n- **Comments**: # for single line, """ for multi-line docstrings`,
        },
        {
          title: 'Official Python Beginners Guide',
          type: 'link' as const,
          url: 'https://docs.python.org/3/tutorial/introduction.html',
        },
      ],
      questQuestions: [
        {
          question: 'Which built-in function outputs text to the standard console in Python?',
          options: ['echo()', 'System.out.println()', 'print()', 'console.log()'],
          correctOption: 2,
        },
        {
          question: 'What is the standard indentation recommended by PEP 8 for Python blocks?',
          options: ['2 spaces', '4 spaces', '1 tab of 8 spaces', 'Any amount is fine'],
          correctOption: 1,
        },
        {
          question: 'What character initiates a single-line comment in Python?',
          options: ['//', '/*', '#', '--'],
          correctOption: 2,
        },
        {
          question: 'What data type does the input() function return by default in Python 3?',
          options: ['int', 'str', 'float', 'bool'],
          correctOption: 1,
        },
        {
          question: 'What is the output of print(type(42))?',
          options: ["<class 'int'>", "<class 'number'>", "<class 'integer'>", 'int'],
          correctOption: 0,
        },
        {
          question: 'Which of the following is NOT a valid Python keyword?',
          options: ['pass', 'def', 'function', 'lambda'],
          correctOption: 2,
        },
        {
          question: 'What happens when evaluating int("3.14") directly in Python?',
          options: ['Returns 3', 'Returns 3.14', 'Raises ValueError', 'Returns 0'],
          correctOption: 2,
        },
        {
          question: 'Which expression calculates 2 to the power of 5 in Python?',
          options: ['2 ^ 5', '2 ** 5', 'power(2, 5)', '2 * 5'],
          correctOption: 1,
        },
        {
          question: 'What is the result of 15 // 4 in Python?',
          options: ['3.75', '3', '4', '3.0'],
          correctOption: 1,
        },
        {
          question: 'What does the float data type represent?',
          options: ['Floating text', 'Decimal numbers', 'Large integers', 'Boolean flags'],
          correctOption: 1,
        },
      ],
    },
    {
      levelNumber: 2,
      title: 'Level 2: Variables, Data Types & Operators',
      youtubeVideoId: 'kqtD5dpn9C8',
      challenge: {
        title: 'Level 2: Smart Billing & Tax Calculator',
        difficulty: 'Easy' as const,
        description:
          'Given item price, quantity, tax rate percentage, and discount percentage, calculate subtotal, discount amount, taxable amount, tax amount, and final total rounded to 2 decimal places.',
        inputFormat: 'Four space-separated numbers: price (float), quantity (int), tax_percent (float), discount_percent (float)',
        outputFormat: 'Final payable total formatted to two decimal places (e.g., "Total: 104.50")',
        constraints: 'price >= 0, quantity >= 1, 0 <= discount_percent <= 100, 0 <= tax_percent <= 100',
        sampleInput: '100.0 2 10.0 5.0',
        sampleOutput: 'Total: 209.00',
        starterCode: `import sys

def main():
    data = sys.stdin.read().split()
    if len(data) < 4:
        return
    price = float(data[0])
    qty = int(data[1])
    tax_pct = float(data[2])
    disc_pct = float(data[3])
    
    subtotal = price * qty
    discount = subtotal * (disc_pct / 100.0)
    taxable = subtotal - discount
    tax = taxable * (tax_pct / 100.0)
    total = taxable + tax
    
    print(f"Total: {total:.2f}")

if __name__ == '__main__':
    main()
`,
        testCases: [
          {
            input: '100.0 2 10.0 5.0',
            expectedOutput: 'Total: 209.00',
            isHidden: false,
          },
          {
            input: '50.0 4 18.0 10.0',
            expectedOutput: 'Total: 212.40',
            isHidden: false,
          },
          {
            input: '25.5 3 5.0 0.0',
            expectedOutput: 'Total: 80.32',
            isHidden: true,
          },
          {
            input: '1200 1 12.0 25.0',
            expectedOutput: 'Total: 1008.00',
            isHidden: true,
          },
        ],
      },
      studyMaterials: [
        {
          title: 'Operators & Precedence Deep Dive',
          type: 'notes' as const,
          content: `# Python Operators Guide\n\n- **Arithmetic**: +, -, *, /, // (floor div), % (modulo), ** (power)\n- **Precedence**: () > ** > *, /, //, % > +, -\n- **Membership**: x in collection, x not in collection\n- **Identity**: x is y (checks memory identity), x == y (checks value equality)\n- **f-strings**: f"{variable:.2f}" formats numbers with precision`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the difference between == and is in Python?',
          options: [
            'They are identical',
            '== checks value equality; is checks object memory identity',
            'is checks value; == checks type',
            '== is deprecated in Python 3',
          ],
          correctOption: 1,
        },
        {
          question: 'What does the expression 5 % 2 evaluate to?',
          options: ['2.5', '2', '1', '0'],
          correctOption: 2,
        },
        {
          question: 'What is the result of 2 + 3 * 4 ** 2?',
          options: ['80', '50', '400', '146'],
          correctOption: 1,
        },
        {
          question: 'Which string formatting syntax is recommended in modern Python 3.6+?',
          options: ['% formatting', 'str.format()', 'f-strings (Formatted string literals)', 'Template strings'],
          correctOption: 2,
        },
        {
          question: 'What is the boolean evaluation of bool("") (empty string)?',
          options: ['True', 'False', 'None', 'Error'],
          correctOption: 1,
        },
        {
          question: 'What operator is used for floor division in Python?',
          options: ['/', '//', '%', 'div()'],
          correctOption: 1,
        },
        {
          question: 'What is the type of variable x in: x = None?',
          options: ['null', 'void', 'NoneType', 'empty'],
          correctOption: 2,
        },
        {
          question: 'Which of the following is a valid Python variable name?',
          options: ['2nd_score', 'total_score', 'total-score', 'class'],
          correctOption: 1,
        },
        {
          question: 'What does "cat" in ["dog", "cat", "bird"] evaluate to?',
          options: ['True', 'False', 'None', '1'],
          correctOption: 0,
        },
        {
          question: 'What is the result of float(5)?',
          options: ['5', '5.0', '"5.0"', 'Error'],
          correctOption: 1,
        },
      ],
    },
    {
      levelNumber: 3,
      title: 'Level 3: Conditions & Decision Making',
      youtubeVideoId: 'DZwmZ8Usvnk',
      challenge: {
        title: 'Level 3: Comprehensive Tiered Tax & Discount Auditor',
        difficulty: 'Easy' as const,
        description:
          'Audit customer shopping orders based on member tier (BRONZE, SILVER, GOLD) and cart value. Apply tier discounts: GOLD gives 20% on > 500 else 15%; SILVER gives 10% on > 300 else 5%; BRONZE gives 5% on > 200 else 0%. If cart <= 0, print "INVALID". Print final payable price rounded to 2 decimals.',
        inputFormat: 'Two space-separated tokens: Tier (string) and CartValue (float)',
        outputFormat: 'Single line: "Payable: <amount>" or "INVALID"',
        constraints: 'Tier in [BRONZE, SILVER, GOLD, PLATINUM], CartValue between -1000 and 100000',
        sampleInput: 'GOLD 600.0',
        sampleOutput: 'Payable: 480.00',
        starterCode: `import sys

def main():
    parts = sys.stdin.read().split()
    if len(parts) < 2:
        return
    tier = parts[0].upper()
    try:
        val = float(parts[1])
    except ValueError:
        print("INVALID")
        return
        
    if val <= 0:
        print("INVALID")
        return
        
    disc = 0.0
    if tier == "GOLD":
        disc = 0.20 if val > 500 else 0.15
    elif tier == "SILVER":
        disc = 0.10 if val > 300 else 0.05
    elif tier == "BRONZE":
        disc = 0.05 if val > 200 else 0.0
    else:
        disc = 0.0
        
    payable = val * (1.0 - disc)
    print(f"Payable: {payable:.2f}")

if __name__ == '__main__':
    main()
`,
        testCases: [
          {
            input: 'GOLD 600.0',
            expectedOutput: 'Payable: 480.00',
            isHidden: false,
          },
          {
            input: 'SILVER 250.0',
            expectedOutput: 'Payable: 237.50',
            isHidden: false,
          },
          {
            input: 'BRONZE 100.0',
            expectedOutput: 'Payable: 100.00',
            isHidden: true,
          },
          {
            input: 'GOLD -50.0',
            expectedOutput: 'INVALID',
            isHidden: true,
          },
        ],
      },
      studyMaterials: [
        {
          title: 'Mastering Python Decision Trees & Guards',
          type: 'notes' as const,
          content: `# Conditionals in Python\n\n- if, elif, else structure\n- Ternary operator: x = a if condition else b\n- Short-circuit evaluation: in 'A and B', B is evaluated only if A is True\n- Truthy/Falsy values: 0, None, "", [], {}, () are Falsy; others Truthy`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the syntax for a ternary conditional expression in Python?',
          options: [
            'condition ? val1 : val2',
            'val1 if condition else val2',
            'if condition then val1 else val2',
            'condition => val1 | val2',
          ],
          correctOption: 1,
        },
        {
          question: 'Which of the following values evaluates to True in a conditional?',
          options: ['[]', '0', '"False"', 'None'],
          correctOption: 2,
        },
        {
          question: 'What keyword connects an alternative condition after an initial if statement?',
          options: ['elseif', 'else if', 'elif', 'otherwise'],
          correctOption: 2,
        },
        {
          question: 'In the expression False and some_function(), why is some_function() not called?',
          options: ['Python syntax error', 'Short-circuit evaluation', 'Threading deadlock', 'Lazy compiling'],
          correctOption: 1,
        },
        {
          question: 'How do you test if a number n is strictly between 10 and 20 in Python?',
          options: ['10 < n and n < 20', '10 < n < 20', 'Both A and B are valid', 'Neither'],
          correctOption: 2,
        },
        {
          question: 'What will print(not not 42) output?',
          options: ['42', 'True', 'False', 'None'],
          correctOption: 1,
        },
        {
          question: 'How do you check if variable x is an instance of int?',
          options: ['typeof(x) == int', 'isinstance(x, int)', 'x.type == int', 'x is int'],
          correctOption: 1,
        },
        {
          question: 'What is the output of: if True: pass?',
          options: ['Executes without error or output', 'Throws IndentationError', 'Prints pass', 'Stops program'],
          correctOption: 0,
        },
        {
          question: 'What condition checks for a leap year in the Gregorian calendar?',
          options: [
            'year % 4 == 0',
            '(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)',
            'year % 400 == 0 and year % 4 == 0',
            'year % 100 == 0',
          ],
          correctOption: 1,
        },
        {
          question: 'Which logical operator inverts the truth value of an expression?',
          options: ['!', '~', 'not', 'inverse'],
          correctOption: 2,
        },
      ],
    },
    {
      levelNumber: 4,
      title: 'Level 4: Loops & Problem Solving',
      youtubeVideoId: '6iF8Xb7Z3wQ',
      challenge: {
        title: 'Level 4: Prime Factorization & Palindrome Auditor',
        difficulty: 'Medium' as const,
        description:
          'Given an integer N, print whether N is a palindrome (e.g., 121 is a palindrome), and list its prime factors in ascending order separated by space.',
        inputFormat: 'Single integer N (N >= 2)',
        outputFormat: 'Line 1: "Palindrome: Yes" or "Palindrome: No"\nLine 2: "Prime Factors: <factors space separated>"',
        constraints: '2 <= N <= 10^7',
        sampleInput: '121',
        sampleOutput: 'Palindrome: Yes\nPrime Factors: 11 11',
        starterCode: `import sys

def main():
    raw = sys.stdin.read().strip()
    if not raw:
        return
    n = int(raw)
    
    # Palindrome check
    s = str(n)
    is_pal = s == s[::-1]
    print(f"Palindrome: {'Yes' if is_pal else 'No'}")
    
    # Prime factorization
    factors = []
    d = 2
    temp = n
    while d * d <= temp:
        while temp % d == 0:
            factors.append(str(d))
            temp //= d
        d += 1
    if temp > 1:
        factors.append(str(temp))
        
    print(f"Prime Factors: {' '.join(factors)}")

if __name__ == '__main__':
    main()
`,
        testCases: [
          {
            input: '121',
            expectedOutput: 'Palindrome: Yes\nPrime Factors: 11 11',
            isHidden: false,
          },
          {
            input: '84',
            expectedOutput: 'Palindrome: No\nPrime Factors: 2 2 3 7',
            isHidden: false,
          },
          {
            input: '1331',
            expectedOutput: 'Palindrome: Yes\nPrime Factors: 11 11 11',
            isHidden: true,
          },
          {
            input: '997',
            expectedOutput: 'Palindrome: No\nPrime Factors: 997',
            isHidden: true,
          },
        ],
      },
      studyMaterials: [
        {
          title: 'Loops, Counters & Iteration Protocols',
          type: 'notes' as const,
          content: `# Loop Constructs in Python\n\n- for item in iterable:\n- while condition:\n- range(start, stop, step)\n- break (terminate loop immediately)\n- continue (skip to next iteration)\n- else clause on loops (executes ONLY if loop finished without hitting a break!)`,
        },
      ],
      questQuestions: [
        {
          question: 'What does the range(2, 10, 3) call generate?',
          options: ['[2, 5, 8]', '[2, 5, 8, 10]', '[3, 6, 9]', '[2, 3, 10]'],
          correctOption: 0,
        },
        {
          question: 'When does the else block attached to a for or while loop execute?',
          options: [
            'Whenever the loop terminates normally without break',
            'Only if an exception is thrown',
            'Whenever break is executed',
            'Loops cannot have an else block',
          ],
          correctOption: 0,
        },
        {
          question: 'What is the purpose of the continue statement?',
          options: [
            'Exits the program immediately',
            'Skips the rest of current iteration and moves to next',
            'Restarts loop from beginning',
            'Pauses loop execution for 1 second',
          ],
          correctOption: 1,
        },
        {
          question: 'What is the time complexity of reversing a number of d digits with a while loop?',
          options: ['O(1)', 'O(d) or O(log10(N))', 'O(N^2)', 'O(2^N)'],
          correctOption: 1,
        },
        {
          question: 'Which loop is typically preferred when the number of iterations is known in advance?',
          options: ['while loop', 'for loop', 'do-while loop', 'infinite loop'],
          correctOption: 1,
        },
        {
          question: 'What does pass do inside a loop body?',
          options: ['Skips to next iteration', 'Acts as a null placeholder statement', 'Exits loop', 'Throws error'],
          correctOption: 1,
        },
        {
          question: 'What will list(range(5, 0, -1)) produce?',
          options: ['[5, 4, 3, 2, 1]', '[5, 4, 3, 2, 1, 0]', '[0, 1, 2, 3, 4, 5]', 'Error'],
          correctOption: 0,
        },
        {
          question: 'What is an Armstrong (narcissistic) number?',
          options: [
            'A number equal to the sum of its digits each raised to the power of digit count',
            'A number divisible by all digits',
            'A number whose reverse is equal to itself',
            'A prime number greater than 100',
          ],
          correctOption: 0,
        },
        {
          question: 'How do you prevent an infinite loop in a while construct?',
          options: [
            'Ensure the loop condition eventually transitions to False',
            'Never use while loops',
            'Always put pass inside the body',
            'Set recursion limit',
          ],
          correctOption: 0,
        },
        {
          question: 'What is the output of: for i in range(3): print(i, end=" ")?',
          options: ['0 1 2 ', '1 2 3 ', '0 1 2 3 ', '3 2 1 '],
          correctOption: 0,
        },
      ],
    },
    {
      levelNumber: 5,
      title: 'Level 5: Strings & Collections',
      youtubeVideoId: 'W8KRzm-HUcc',
      challenge: {
        title: 'Level 5: Word Frequency Analyzer & Anagram Clusters',
        difficulty: 'Medium' as const,
        description:
          'Given a paragraph of text, clean punctuation, convert to lowercase, count the frequency of each unique word, and output the top 3 most frequent words in format "word: count". If tied, sort alphabetically.',
        inputFormat: 'A single or multiple lines of raw text',
        outputFormat: 'Top 3 words, each on a new line: "<word>: <count>"',
        constraints: 'Text length <= 10^5 characters, at least 3 distinct words',
        sampleInput: 'The quick brown fox jumps over the lazy dog. The fox was quick.',
        sampleOutput: 'the: 3\nfox: 2\nquick: 2',
        starterCode: `import sys
import re
from collections import Counter

def main():
    text = sys.stdin.read()
    if not text.strip():
        return
        
    words = re.findall(r'\\b[a-zA-Z]+\\b', text.lower())
    counts = Counter(words)
    
    # Sort by (-count, word)
    sorted_words = sorted(counts.items(), key=lambda x: (-x[1], x[0]))
    for word, cnt in sorted_words[:3]:
        print(f"{word}: {cnt}")

if __name__ == '__main__':
    main()
`,
        testCases: [
          {
            input: 'The quick brown fox jumps over the lazy dog. The fox was quick.',
            expectedOutput: 'the: 3\nfox: 2\nquick: 2',
            isHidden: false,
          },
          {
            input: 'apple banana apple orange banana apple grapes kiwi',
            expectedOutput: 'apple: 3\nbanana: 2\ngrapes: 1',
            isHidden: false,
          },
          {
            input: 'Data science with Python is fun. Python code is clean and Python is fast.',
            expectedOutput: 'is: 3\npython: 3\nand: 1',
            isHidden: true,
          },
        ],
      },
      studyMaterials: [
        {
          title: 'Deep Dive: Lists, Tuples, Dictionaries & Sets',
          type: 'notes' as const,
          content: `# Python Collections\n\n- **List**: Mutable, ordered, duplicates allowed: [1, 2, 3]\n- **Tuple**: Immutable, ordered: (1, 2, 3)\n- **Set**: Mutable, unordered, unique items only: {1, 2, 3}\n- **Dict**: Key-value mapping, O(1) average lookup: {"a": 1}\n- **List Comprehension**: [x**2 for x in nums if x % 2 == 0]`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the average time complexity of key lookup in a Python dictionary?',
          options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
          correctOption: 0,
        },
        {
          question: 'How do you create a set containing unique elements from a list nums?',
          options: ['set(nums)', 'dict(nums)', 'tuple(nums)', '{nums}'],
          correctOption: 0,
        },
        {
          question: 'What is the primary difference between a list and a tuple?',
          options: [
            'Lists are mutable; tuples are immutable',
            'Tuples can only hold numbers',
            'Lists cannot be nested',
            'Tuples use square brackets',
          ],
          correctOption: 0,
        },
        {
          question: 'What does the slice s[::-1] do on a string s?',
          options: ['Returns string reversed', 'Deletes last char', 'Returns first char', 'Throws error'],
          correctOption: 0,
        },
        {
          question: 'What method safely retrieves a dictionary value with an optional default if key does not exist?',
          options: ['dict.get(key, default)', 'dict.fetch(key)', 'dict[key]', 'dict.find(key)'],
          correctOption: 0,
        },
        {
          question: 'Which comprehension syntax creates a set in Python?',
          options: [
            '{x for x in data}',
            '[x for x in data]',
            '(x for x in data)',
            '<x for x in data>',
          ],
          correctOption: 0,
        },
        {
          question: 'What is the output of [1, 2] + [3, 4] in Python?',
          options: ['[1, 2, 3, 4]', '[4, 6]', '[[1, 2], [3, 4]]', 'Error'],
          correctOption: 0,
        },
        {
          question: 'How do you remove and return the last item from a list in O(1) time?',
          options: ['list.pop()', 'list.remove()', 'del list[0]', 'list.shift()'],
          correctOption: 0,
        },
        {
          question: 'Which method splits a string by whitespace into a list of words?',
          options: ['str.split()', 'str.partition()', 'str.explode()', 'str.slice()'],
          correctOption: 0,
        },
        {
          question: 'What does set A & set B compute?',
          options: ['Union', 'Intersection', 'Difference', 'Symmetric Difference'],
          correctOption: 1,
        },
      ],
    },
    {
      levelNumber: 6,
      title: 'Level 6: Functions & Modular Programming',
      youtubeVideoId: 'u-OmVr_fT4s',
      challenge: {
        title: 'Level 6: Modular Pipeline & Functional Aggregator',
        difficulty: 'Medium' as const,
        description:
          'Implement a functional data pipeline using higher-order functions. Given a list of integers, filter only even numbers, square them, and compute their sum. If no even numbers exist, return 0.',
        inputFormat: 'A single line containing space-separated integers',
        outputFormat: 'Single integer representing sum of squared even numbers',
        constraints: '0 <= list length <= 10^5, -1000 <= element <= 1000',
        sampleInput: '1 2 3 4 5 6',
        sampleOutput: '56',
        starterCode: `import sys
from functools import reduce

def process_pipeline(nums):
    # Filter evens, map squares, reduce sum
    evens = filter(lambda x: x % 2 == 0, nums)
    squares = map(lambda x: x * x, evens)
    return sum(squares)

def main():
    raw = sys.stdin.read().split()
    if not raw:
        print(0)
        return
    nums = [int(x) for x in raw]
    print(process_pipeline(nums))

if __name__ == '__main__':
    main()
`,
        testCases: [
          {
            input: '1 2 3 4 5 6',
            expectedOutput: '56',
            isHidden: false,
          },
          {
            input: '1 3 5 7',
            expectedOutput: '0',
            isHidden: false,
          },
          {
            input: '10 20 -2',
            expectedOutput: '504',
            isHidden: true,
          },
          {
            input: '-4 -6',
            expectedOutput: '52',
            isHidden: true,
          },
        ],
      },
      studyMaterials: [
        {
          title: 'Functions, *args, **kwargs, Scope & Closures',
          type: 'notes' as const,
          content: `# Modular Python\n\n- def func(*args, **kwargs): variable positional and keyword arguments\n- Lambda functions: anonymous single-expression functions: lambda x: x * 2\n- map(), filter(), functools.reduce()\n- Recursion: base case + recursive step (sys.setrecursionlimit)\n- if __name__ == '__main__': guard script execution from imports`,
        },
      ],
      questQuestions: [
        {
          question: 'What does *args in a function parameter list collect?',
          options: [
            'Arbitrary positional arguments as a tuple',
            'Arbitrary keyword arguments as a dictionary',
            'Pointers to memory addresses',
            'A required list parameter',
          ],
          correctOption: 0,
        },
        {
          question: 'What does **kwargs in a function definition capture?',
          options: [
            'Keyword arguments as a dict',
            'Positional arguments as a list',
            'Double pointers',
            'Global variables',
          ],
          correctOption: 0,
        },
        {
          question: 'What does if __name__ == "__main__": do in a Python script?',
          options: [
            'Ensures code executes only when run directly as a script, not when imported as a module',
            'Defines the main class',
            'Enables multi-threading',
            'Compiles code to C',
          ],
          correctOption: 0,
        },
        {
          question: 'What is a lambda function in Python?',
          options: [
            'An anonymous, single-expression function',
            'A generator function',
            'A class method',
            'A recursive loop',
          ],
          correctOption: 0,
        },
        {
          question: 'Which module provides the reduce() higher-order function in Python 3?',
          options: ['functools', 'itertools', 'operator', 'math'],
          correctOption: 0,
        },
        {
          question: 'What keyword allows modifying a variable defined in the global scope inside a function?',
          options: ['global', 'nonlocal', 'extern', 'public'],
          correctOption: 0,
        },
        {
          question: 'What happens if a recursive function does not have a base case?',
          options: [
            'RecursionError (maximum recursion depth exceeded)',
            'Memory automatically doubles',
            'Returns None',
            'Infinite loop with 0 CPU',
          ],
          correctOption: 0,
        },
        {
          question: 'What keyword allows modifying a variable in an outer enclosing function scope?',
          options: ['nonlocal', 'global', 'outer', 'super'],
          correctOption: 0,
        },
        {
          question: 'What does a function return if it does not have an explicit return statement?',
          options: ['None', '0', 'False', 'void'],
          correctOption: 0,
        },
        {
          question: 'Are arguments passed by value or by assignment (object reference) in Python?',
          options: [
            'Pass by object reference (call by sharing)',
            'Strict pass by value only',
            'Strict pass by reference only',
            'Depends on type',
          ],
          correctOption: 0,
        },
      ],
    },
    {
      levelNumber: 7,
      title: 'Level 7: Object-Oriented Programming',
      youtubeVideoId: 'Ej_02ICOIgs',
      challenge: {
        title: 'Level 7: Robust Banking System & Account Hierarchy',
        difficulty: 'Medium' as const,
        description:
          'Design an OOP Banking system. Create Base Account, SavingsAccount (earns interest), and CheckingAccount (applies fee). Given operations DEPOSIT, WITHDRAW, APPLY_INTEREST, process transactions and print final balance.',
        inputFormat: 'Account type (SAVINGS/CHECKING), initial balance, and N operations: TYPE AMOUNT',
        outputFormat: 'Final balance formatted to 2 decimals: "Balance: <amount>"',
        constraints: 'Initial balance >= 0, valid transactions',
        sampleInput: 'SAVINGS 1000\nDEPOSIT 500\nWITHDRAW 200\nINTEREST 5',
        sampleOutput: 'Balance: 1365.00',
        starterCode: `import sys

class Account:
    def __init__(self, balance: float):
        self._balance = balance

    def deposit(self, amount: float):
        self._balance += amount

    def withdraw(self, amount: float):
        if amount <= self._balance:
            self._balance -= amount

    @property
    def balance(self):
        return self._balance

class SavingsAccount(Account):
    def apply_interest(self, rate_pct: float):
        self._balance += self._balance * (rate_pct / 100.0)

def main():
    lines = [l.strip() for l in sys.stdin if l.strip()]
    if not lines:
        return
    header = lines[0].split()
    acc_type = header[0]
    initial = float(header[1])
    
    acc = SavingsAccount(initial) if acc_type == 'SAVINGS' else Account(initial)
    for line in lines[1:]:
        parts = line.split()
        op = parts[0]
        amt = float(parts[1])
        if op == 'DEPOSIT':
            acc.deposit(amt)
        elif op == 'WITHDRAW':
            acc.withdraw(amt)
        elif op == 'INTEREST' and isinstance(acc, SavingsAccount):
            acc.apply_interest(amt)
            
    print(f"Balance: {acc.balance:.2f}")

if __name__ == '__main__':
    main()
`,
        testCases: [
          {
            input: 'SAVINGS 1000\nDEPOSIT 500\nWITHDRAW 200\nINTEREST 5',
            expectedOutput: 'Balance: 1365.00',
            isHidden: false,
          },
          {
            input: 'CHECKING 500\nDEPOSIT 100\nWITHDRAW 300',
            expectedOutput: 'Balance: 300.00',
            isHidden: false,
          },
          {
            input: 'SAVINGS 2000\nWITHDRAW 500\nINTEREST 10',
            expectedOutput: 'Balance: 1650.00',
            isHidden: true,
          },
        ],
      },
      studyMaterials: [
        {
          title: 'Object-Oriented Programming & Design Patterns',
          type: 'notes' as const,
          content: `# Python OOP Pillars\n\n- **Encapsulation**: Private attributes with _single or __double leading underscores, @property getters and setters\n- **Inheritance**: class Dog(Animal): super().__init__()\n- **Polymorphism**: Duck typing ("if it quacks like a duck...")\n- **Dunder Methods**: __init__, __str__, __repr__, __len__, __eq__\n- **Class & Static Methods**: @classmethod with cls, @staticmethod without self`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the purpose of the super() function in an inherited subclass?',
          options: [
            'Calls methods of the parent (super) class',
            'Makes the class static',
            'Grants admin superuser privileges',
            'Creates a copy of the object',
          ],
          correctOption: 0,
        },
        {
          question: 'What decorator is used to define a getter property in Python?',
          options: ['@property', '@getter', '@prop', '@field'],
          correctOption: 0,
        },
        {
          question: 'What magic/dunder method controls the informal string representation of an object for print()?',
          options: ['__str__', '__repr__', '__print__', '__format__'],
          correctOption: 0,
        },
        {
          question: 'How do you define a class method that receives the class type cls as its first parameter?',
          options: ['@classmethod', '@staticmethod', '@meta', '@type'],
          correctOption: 0,
        },
        {
          question: 'What does name mangling in Python do when an attribute begins with __ (double underscore)?',
          options: [
            'Mangles the name to _ClassName__attribute to avoid collision in subclasses',
            'Encrypts the variable in RAM',
            'Makes the attribute strictly unreadable',
            'Throws a syntax warning',
          ],
          correctOption: 0,
        },
        {
          question: 'Which module allows creating Abstract Base Classes in Python?',
          options: ['abc', 'abstract', 'types', 'classes'],
          correctOption: 0,
        },
        {
          question: 'What is method overriding?',
          options: [
            'Redefining a parent class method in a subclass with specialized behavior',
            'Deleting a method',
            'Overloading method with multiple argument types',
            'Renaming a method',
          ],
          correctOption: 0,
        },
        {
          question: 'What is the Method Resolution Order (MRO) algorithm used by Python?',
          options: ['C3 Linearization algorithm', 'DFS', 'BFS', 'Random order'],
          correctOption: 0,
        },
        {
          question: 'What does @staticmethod do?',
          options: [
            'Defines a method that does not receive self or cls as its first argument',
            'Locks the method from being changed',
            'Makes the return value constant',
            'Runs the method at compile time',
          ],
          correctOption: 0,
        },
        {
          question: 'What dunder method defines object equality (==)?',
          options: ['__eq__', '__equals__', '__cmp__', '__is__'],
          correctOption: 0,
        },
      ],
    },
    {
      levelNumber: 8,
      title: 'Level 8: Advanced Python & File/Data Handling',
      youtubeVideoId: 'XIv3_fH7c_w',
      challenge: {
        title: 'Level 8: High-Performance Log File Parser & Aggregator',
        difficulty: 'Hard' as const,
        description:
          'Given a stream of web server log entries in format "[TIMESTAMP] LEVEL IP:PORT - MESSAGE", use regex to extract log level (INFO, WARN, ERROR) and status. Count errors by unique IP address and print IPs with >= 2 errors in alphabetical order.',
        inputFormat: 'Multiple lines of log entries',
        outputFormat: 'List of offending IPs with error counts: "<IP>: <count>", or "CLEAN" if none',
        constraints: 'Up to 10^4 log lines',
        sampleInput: '[2026-10-08 10:00:00] ERROR 192.168.1.1:8080 - Database connection failed\n[2026-10-08 10:01:00] INFO 192.168.1.2:80 - Page loaded\n[2026-10-08 10:02:00] ERROR 192.168.1.1:8080 - Timeout error',
        sampleOutput: '192.168.1.1: 2',
        starterCode: `import sys
import re
from collections import Counter

def main():
    lines = sys.stdin.read().splitlines()
    error_pattern = re.compile(r'\\[.*?\\]\\s+ERROR\\s+([0-9.]+):')
    
    error_counts = Counter()
    for line in lines:
        match = error_pattern.search(line)
        if match:
            ip = match.group(1)
            error_counts[ip] += 1
            
    suspects = [(ip, cnt) for ip, cnt in error_counts.items() if cnt >= 2]
    suspects.sort(key=lambda x: x[0])
    
    if not suspects:
        print("CLEAN")
    else:
        for ip, cnt in suspects:
            print(f"{ip}: {cnt}")

if __name__ == '__main__':
    main()
`,
        testCases: [
          {
            input: '[2026-10-08 10:00:00] ERROR 192.168.1.1:8080 - Database connection failed\n[2026-10-08 10:01:00] INFO 192.168.1.2:80 - Page loaded\n[2026-10-08 10:02:00] ERROR 192.168.1.1:8080 - Timeout error',
            expectedOutput: '192.168.1.1: 2',
            isHidden: false,
          },
          {
            input: '[2026-10-08 10:00:00] INFO 10.0.0.1:80 - OK\n[2026-10-08 10:01:00] WARN 10.0.0.2:80 - Low RAM',
            expectedOutput: 'CLEAN',
            isHidden: false,
          },
          {
            input: '[2026-10-08 10:00] ERROR 172.16.0.5:443 - Crash\n[2026-10-08 10:01] ERROR 172.16.0.5:443 - Crash\n[2026-10-08 10:02] ERROR 10.0.0.9:80 - Fail\n[2026-10-08 10:03] ERROR 10.0.0.9:80 - Fail',
            expectedOutput: '10.0.0.9: 2\n172.16.0.5: 2',
            isHidden: true,
          },
        ],
      },
      studyMaterials: [
        {
          title: 'Decorators, Generators, Context Managers & Files',
          type: 'notes' as const,
          content: `# Advanced Python Concepts\n\n- **Generators**: Use yield to produce values on-demand with lazy memory footprint\n- **Decorators**: Functions that wrap other functions using @decorator syntax\n- **Context Managers**: with open('file.txt', 'r') as f: automatically handles cleanup\n- **Custom Exceptions**: class CustomError(Exception): pass\n- **Regex**: re.search(), re.findall(), re.sub()`,
        },
      ],
      questQuestions: [
        {
          question: 'What keyword turns a standard Python function into a generator?',
          options: ['yield', 'generate', 'return', 'emit'],
          correctOption: 0,
        },
        {
          question: 'What is the primary memory advantage of a generator over a list comprehension?',
          options: [
            'Generators compute values lazily one at a time, consuming O(1) memory',
            'Generators compress data into zip format',
            'Generators run in C thread',
            'Generators do not allow strings',
          ],
          correctOption: 0,
        },
        {
          question: 'What two dunder methods are required to implement a Python Context Manager?',
          options: [
            '__enter__ and __exit__',
            '__open__ and __close__',
            '__start__ and __stop__',
            '__init__ and __del__',
          ],
          correctOption: 0,
        },
        {
          question: 'What does the with statement guarantee when opening files?',
          options: [
            'File is properly closed even if an exception is raised',
            'File is encrypted',
            'File is written in binary mode',
            'File opens with root permissions',
          ],
          correctOption: 0,
        },
        {
          question: 'What is a decorator in Python?',
          options: [
            'A higher-order function that takes another function and extends its behavior without modifying it',
            'A UI theme engine',
            'A string formatting template',
            'A compiler optimization',
          ],
          correctOption: 0,
        },
        {
          question: 'Which clause in a try-except block executes ONLY if no exception occurred?',
          options: ['else', 'finally', 'then', 'catch'],
          correctOption: 0,
        },
        {
          question: 'Which clause in a try-except block ALWAYS executes, regardless of errors?',
          options: ['finally', 'else', 'always', 'end'],
          correctOption: 0,
        },
        {
          question: 'In regular expressions, what does \\d+ match?',
          options: [
            'One or more consecutive digits (0-9)',
            'Any letter',
            'Whitespace',
            'Punctuation only',
          ],
          correctOption: 0,
        },
        {
          question: 'How do you create a custom exception in Python?',
          options: [
            'Inherit from the built-in Exception class',
            'Use the @exception decorator',
            'Import custom_error',
            'Set sys.exception = True',
          ],
          correctOption: 0,
        },
        {
          question: 'What standard library module handles date and time operations?',
          options: ['datetime', 'timekeeper', 'clock', 'calendar'],
          correctOption: 0,
        },
      ],
    },
    {
      levelNumber: 9,
      title: 'Level 9: APIs, Databases & Real-World Python',
      youtubeVideoId: '7rA4_84qQ5o',
      challenge: {
        title: 'Level 9: REST API Response Normalizer & SQL Query Simulator',
        difficulty: 'Hard' as const,
        description:
          'Simulate a lightweight in-memory SQL database query engine. Support INSERT into table, SELECT * WHERE column = val, and DELETE. Output query results as formatted JSON arrays.',
        inputFormat: 'JSON string representing database commands array',
        outputFormat: 'JSON string of executed SELECT results',
        constraints: 'Valid JSON input, operations <= 1000',
        sampleInput: '{"ops": [{"op": "INSERT", "data": {"id": 1, "status": "active"}}, {"op": "INSERT", "data": {"id": 2, "status": "pending"}}, {"op": "SELECT", "where": {"status": "active"}}]}',
        sampleOutput: '[{"id": 1, "status": "active"}]',
        starterCode: `import sys
import json

def main():
    raw = sys.stdin.read().strip()
    if not raw:
        print("[]")
        return
    try:
        payload = json.loads(raw)
    except Exception:
        print("[]")
        return
        
    db = []
    results = []
    for item in payload.get("ops", []):
        op = item.get("op")
        if op == "INSERT":
            db.append(item.get("data", {}))
        elif op == "SELECT":
            query = item.get("where", {})
            matched = [row for row in db if all(row.get(k) == v for k, v in query.items())]
            results.extend(matched)
            
    print(json.dumps(results))

if __name__ == '__main__':
    main()
`,
        testCases: [
          {
            input: '{"ops": [{"op": "INSERT", "data": {"id": 1, "status": "active"}}, {"op": "INSERT", "data": {"id": 2, "status": "pending"}}, {"op": "SELECT", "where": {"status": "active"}}]}',
            expectedOutput: '[{"id": 1, "status": "active"}]',
            isHidden: false,
          },
          {
            input: '{"ops": [{"op": "INSERT", "data": {"name": "Alice", "role": "admin"}}, {"op": "SELECT", "where": {"role": "guest"}}]}',
            expectedOutput: '[]',
            isHidden: false,
          },
          {
            input: '{"ops": [{"op": "INSERT", "data": {"x": 10}}, {"op": "INSERT", "data": {"x": 20}}, {"op": "SELECT", "where": {"x": 20}}]}',
            expectedOutput: '[{"x": 20}]',
            isHidden: true,
          },
        ],
      },
      studyMaterials: [
        {
          title: 'Building APIs with FastAPI & SQLite Integration',
          type: 'notes' as const,
          content: `# Real-World Python\n\n- **REST Architecture**: GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)\n- **requests**: requests.get(url, headers={}, params={})\n- **SQLite**: import sqlite3; conn = sqlite3.connect('app.db')\n- **Parameterized Queries**: cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,)) prevents SQL injection!\n- **FastAPI**: Modern async web framework with automatic OpenAPI docs`,
        },
      ],
      questQuestions: [
        {
          question: 'Why MUST you use parameterized queries (? or %s) instead of string formatting with SQL in Python?',
          options: [
            'To completely prevent SQL Injection vulnerabilities',
            'Because SQL strings are limited to 256 characters',
            'To make the query faster in RAM',
            'Python requires it to compile',
          ],
          correctOption: 0,
        },
        {
          question: 'Which HTTP status code represents successful resource creation?',
          options: ['201 Created', '200 OK', '204 No Content', '301 Moved Permanently'],
          correctOption: 0,
        },
        {
          question: 'Which popular Python library is the industry standard for sending HTTP client requests?',
          options: ['requests', 'httplib', 'urllib2', 'curl_python'],
          correctOption: 0,
        },
        {
          question: 'What is the purpose of virtual environments (venv) in Python projects?',
          options: [
            'Isolates project dependencies and package versions to avoid global system conflicts',
            'Accelerates Python CPU execution speed',
            'Runs Python in a Docker container automatically',
            'Encrypts source code',
          ],
          correctOption: 0,
        },
        {
          question: 'What file lists project Python package dependencies for pip install -r?',
          options: ['requirements.txt', 'packages.json', 'dependencies.xml', 'pip.config'],
          correctOption: 0,
        },
        {
          question: 'What standard library module provides a zero-setup relational database in Python?',
          options: ['sqlite3', 'mysql', 'postgres_py', 'db_sqlite'],
          correctOption: 0,
        },
        {
          question: 'In FastAPI or Flask, what format is typically used to serialize and exchange API data?',
          options: ['JSON', 'XML', 'CSV', 'YAML'],
          correctOption: 0,
        },
        {
          question: 'What does conn.commit() do in a database connection?',
          options: [
            'Commits and persists the transaction changes to the database file/server',
            'Rolls back changes',
            'Closes the connection',
            'Locks the database',
          ],
          correctOption: 0,
        },
        {
          question: 'How do you securely load sensitive API keys and secrets in production Python apps?',
          options: [
            'Read from environment variables using os.environ or python-dotenv',
            'Hardcode them in the Git repository',
            'Save them in a public comment',
            'Print them in error logs',
          ],
          correctOption: 0,
        },
        {
          question: 'What HTTP method is semantically intended for partial updates to a resource?',
          options: ['PATCH', 'GET', 'POST', 'HEAD'],
          correctOption: 0,
        },
      ],
    },
    {
      levelNumber: 10,
      title: 'Level 10: Advanced Python, Algorithms & Professional Development',
      youtubeVideoId: 't2CEgPsws3U',
      challenge: {
        title: 'Level 10: Asynchronous Task Scheduler & LRU Cache System',
        difficulty: 'Hard' as const,
        description:
          'Design an LRU (Least Recently Used) Cache with get(key) and put(key, value) operations in O(1) time complexity. Given a sequence of GET and PUT commands, output the values returned by GET commands.',
        inputFormat: 'Capacity C followed by N lines of operations: "PUT key val" or "GET key"',
        outputFormat: 'Results of GET commands separated by space (-1 if key not found)',
        constraints: '1 <= Capacity <= 10^4, Operations <= 10^5',
        sampleInput: '2\nPUT 1 10\nPUT 2 20\nGET 1\nPUT 3 30\nGET 2\nGET 3',
        sampleOutput: '10 -1 30',
        starterCode: `import sys
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

def main():
    lines = [l.strip() for l in sys.stdin if l.strip()]
    if not lines:
        return
    cap = int(lines[0])
    lru = LRUCache(cap)
    outputs = []
    
    for line in lines[1:]:
        parts = line.split()
        if parts[0] == 'PUT':
            lru.put(int(parts[1]), int(parts[2]))
        elif parts[0] == 'GET':
            outputs.append(str(lru.get(int(parts[1]))))
            
    print(" ".join(outputs))

if __name__ == '__main__':
    main()
`,
        testCases: [
          {
            input: '2\nPUT 1 10\nPUT 2 20\nGET 1\nPUT 3 30\nGET 2\nGET 3',
            expectedOutput: '10 -1 30',
            isHidden: false,
          },
          {
            input: '1\nPUT 5 50\nGET 5\nPUT 6 60\nGET 5\nGET 6',
            expectedOutput: '50 -1 60',
            isHidden: false,
          },
          {
            input: '2\nGET 1\nPUT 1 100\nGET 1',
            expectedOutput: '-1 100',
            isHidden: true,
          },
        ],
      },
      studyMaterials: [
        {
          title: 'Algorithms, Async IO, Testing & Production Engineering',
          type: 'notes' as const,
          content: `# Professional Python Engineering\n\n- **asyncio**: Event loop, async def, await for non-blocking I/O operations\n- **Type Hints & Dataclasses**: @dataclass from dataclasses, typing.List, Optional\n- **Unit Testing**: pytest framework, test fixtures, mocking\n- **Code Quality**: PEP 8 styling, flake8, black, ruff formatting\n- **Big O Optimization**: Profiling with cProfile, timeit`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the purpose of the asyncio event loop in Python?',
          options: [
            'Manages and distributes execution of asynchronous tasks on a single thread via cooperative multitasking',
            'Creates 100 OS threads automatically',
            'Compiles Python code into machine binary',
            'Connects to a MySQL cluster',
          ],
          correctOption: 0,
        },
        {
          question: 'What keyword defines an asynchronous coroutine function in Python 3.5+?',
          options: ['async def', 'def async', 'coroutine def', 'future def'],
          correctOption: 0,
        },
        {
          question: 'What does the @dataclass decorator from the standard library dataclasses module provide?',
          options: [
            'Automatically generates __init__, __repr__, and __eq__ methods based on type annotations',
            'Encrypts data fields',
            'Connects class to SQLite table',
            'Converts class to JSON schema',
          ],
          correctOption: 0,
        },
        {
          question: 'What is the GIL (Global Interpreter Lock) in CPython?',
          options: [
            'A mutex mechanism preventing multiple native threads from executing Python bytecodes simultaneously',
            'A cryptographic locking algorithm',
            'An IDE plugin',
            'A network firewall in Python',
          ],
          correctOption: 0,
        },
        {
          question: 'When should multiprocessing be chosen over multithreading in Python?',
          options: [
            'For CPU-bound tasks requiring true multi-core parallel processing',
            'For I/O bound network requests',
            'For small GUI animations',
            'When memory is extremely limited',
          ],
          correctOption: 0,
        },
        {
          question: 'Which test framework is the industry standard for Python test automation and fixtures?',
          options: ['pytest', 'junit_py', 'pycheck', 'mocha'],
          correctOption: 0,
        },
        {
          question: 'What PEP standard defines the official Python Style Guide?',
          options: ['PEP 8', 'PEP 20', 'PEP 484', 'PEP 257'],
          correctOption: 0,
        },
        {
          question: 'What is the time complexity of searching a sorted array using Binary Search?',
          options: ['O(log N)', 'O(1)', 'O(N)', 'O(N log N)'],
          correctOption: 0,
        },
        {
          question: 'What data structure enables an LRU cache to achieve O(1) get and put complexity?',
          options: [
            'Hash Map combined with a Doubly Linked List (OrderedDict)',
            'Binary Search Tree',
            'Array with bubble sort',
            'Stack',
          ],
          correctOption: 0,
        },
        {
          question: 'What is the Zen of Python accessible via import this?',
          options: [
            'A collection of guiding aphorisms for Python programming philosophy',
            'An easter egg game',
            'A deprecated math library',
            'A compiler diagnostic',
          ],
          correctOption: 0,
        },
      ],
    },
  ];

  // Seed Levels and Coding Challenges
  for (const lvl of levelsData) {
    // 1. Create or Find CodingChallenge
    let challenge = await CodingChallenge.findOne({ title: lvl.challenge.title });
    if (!challenge) {
      challenge = await CodingChallenge.create({
        title: lvl.challenge.title,
        description: lvl.challenge.description,
        inputFormat: lvl.challenge.inputFormat,
        outputFormat: lvl.challenge.outputFormat,
        constraints: lvl.challenge.constraints,
        sampleInput: lvl.challenge.sampleInput,
        sampleOutput: lvl.challenge.sampleOutput,
        difficulty: lvl.challenge.difficulty,
        allowedLanguages: ['python'],
        starterCode: {
          python: lvl.challenge.starterCode,
        },
        testCases: lvl.challenge.testCases,
        timeLimitMinutes: 30,
        isPublished: true,
      });
      console.log(`[Seed] Created challenge: "${challenge.title}" (${challenge._id})`);
    } else {
      console.log(`[Seed] Using existing challenge: "${challenge.title}" (${challenge._id})`);
    }

    // 2. Create Level
    const levelDoc = await Level.create({
      domainId: domain._id,
      levelNumber: lvl.levelNumber,
      title: lvl.title,
      youtubeVideoId: lvl.youtubeVideoId,
      studyMaterials: lvl.studyMaterials,
      questQuestions: lvl.questQuestions,
      codingChallengeId: challenge._id,
    });

    console.log(
      `[Seed] Created Level ${levelDoc.levelNumber}: "${levelDoc.title}" with challenge ${challenge._id}`
    );
  }

  console.log('\n========================================================================');
  console.log(' PYTHON PROGRAMMING COURSE SEEDED SUCCESSFULLY (10/10 LEVELS)!');
  console.log('========================================================================\n');

  await mongoose.disconnect();
}

seedPythonCourse().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
