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
  "Thousand",
  "Million",
  "Billion",
  "Trillion",
  "Quadrillion",
  "Quintillion",
  "Sextillion",
  "Septillion",
  "Octillion",
  "Nonillion",
  "Decillion",
  "Undecillion",
  "Duodecillion",
  "Tredecillion",
  "Quatturodecillion",
  "Quindecillion",
  "Sexdecillion",
];

const trimLeadingZeros = (number: string): string => {
  while (number[0] === "0") {
    number = number.slice(1);
  }
  return number.trimEnd();
};

if (import.meta.main) {
  for await (const number of number_parts(bigint_numbers(raw_numbers()))) {
    const mapped = number
      .map((p, i) => `${p.value} ${magnitude_label[number.length - i - 1]}`)
      .map(trimLeadingZeros)
      .filter((part) => !part.startsWith(" ") && part.length !== 0);

    console.log(mapped.join(", "));
  }
}
