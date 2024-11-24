/**
 * An async generator that gets the raw numbers inputted to the program
 * either through the command line editor or through the standard input.
 *
 * @returns {AsyncGenerator<string>} The asynchronous generator yielding numbers as strings.
 */
export async function* raw_numbers(): AsyncGenerator<string> {
  if (!Deno.stdin.isTerminal()) {
    const decoder_stream = new TextDecoderStream();
    const reader = Deno.stdin.readable.pipeThrough(decoder_stream);

    for await (const input of reader) {
      for (const line of input.split("\n")) {
        const item = line.trim();
        if (item.length !== 0) {
          yield item;
        }
      }
    }
  } else {
    for (const input of Deno.args) {
      const item = input.trim();
      if (item.length !== 0) {
        yield item;
      }
    }
  }
}

/**
 * An async generator that consumes an async generator that produces
 * nubmers in string format and convert thems to bigint's.
 *
 * @param {AsyncGenerator<string>} raw_numbers The numers generator.
 * @returns {AsyncGenerator<bigint>} The asynchronous generator yielding bigints
 */
export async function* bigint_numbers(
  raw_numbers: AsyncGenerator<string>,
): AsyncGenerator<bigint> {
  for await (const number_string of raw_numbers) {
    try {
      yield BigInt(number_string);
    } catch (_: unknown) {
      continue;
    }
  }
}

/**
 * An async generator that consumes an async generator that yields
 * bigint numbers and breaks them up into their parts.
 *
 * @param {AsyncGenerator<bigint>} bigint_numbers The bigint generator.
 * @returns {AsyncGenerator<Intl.NumberFormatPart[]>} The asynchronous generator yields the parts of numbers.
 */
export async function* number_parts(
  bigint_numbers: AsyncGenerator<bigint>,
): AsyncGenerator<Intl.NumberFormatPart[]> {
  const formatter = Intl.NumberFormat(new Intl.Locale("en"));
  for await (const number of bigint_numbers) {
    yield formatter.formatToParts(number).filter((x) => x.type !== "group");
  }
}

const magnitude_label = [
  "",
  "thousand",
  "million",
  "billion",
  "trillion",
  "quadrillion",
  "quintillion",
  "sextillion",
  "septillion",
  "octillion",
  "nonillion",
  "decillion",
  "undecillion",
  "duodecillion",
  "tredecillion",
  "quatturodecillion",
  "quindecillion",
  "sexdecillion",
];

const num_label = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];

const tens_label = [
  "zeros",
  "tens",
  "twenty",
  "thirty",
  "fourty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

/**
 * Removes the leading 0's, and trims the white space on the end from a string and returns it.
 *
 * @param {string} number The string to process.
 * @return {string} The processed string.
 */
const trimLeadingZeros = (number: string): string => {
  while (number[0] === "0") {
    number = number.slice(1);
  }
  return number.trimEnd();
};

/**
 * Transform a string holding a valid  number below one thousand
 * into the fully written out equivalent.
 *
 * If the string passed in is holding value langer that 1000, the
 * first three characters will form the number that gets interpreted.
 *
 * @param {string} part The string holding the number under a thousand.
 * @returns {string} The fully written out number
 */
const format_under_1000 = (part: string): string => {
  if (part.length === 0) {
    return "zero";
  }

  if (part.length === 1) {
    return num_label[parseInt(part)];
  }

  if (part.length === 2) {
    const parsed = parseInt(part);
    if (parsed <= 20) return num_label[parsed];
    const first = part.slice(0, 1);
    const second = part.slice(1, 2);
    const tens = `${tens_label[parseInt(first)]}`;
    if (second === "0") return tens;
    return `${tens} ${num_label[parseInt(second)]}`;
  }

  const first = part.slice(0, 1);
  const second = part.slice(1, 2);
  const third = part.slice(2, 3);
  const num = `${num_label[parseInt(first)]} hunderd`;
  if (second === "0") return num;
  if (second === "1") return `${num} ${num_label[parseInt(part.slice(1))]}`;
  const tens = `${tens_label[parseInt(second)]}`;
  if (third === "0") return `${num} ${tens}`;
  return `${num} ${tens} ${num_label[parseInt(third)]}`;
};

if (import.meta.main) {
  for await (const number of number_parts(bigint_numbers(raw_numbers()))) {
    const mapped = number
      .map((p, i) => [
        trimLeadingZeros(p.value),
        magnitude_label[number.length - i - 1],
      ])
      .filter(([num]) => !num.startsWith(" ") && num.length !== 0);

    console.log(
      mapped
        .map(([num, label]) => `${format_under_1000(num)} ${label}`)
        .join(", ") || "zero",
    );
  }
}
