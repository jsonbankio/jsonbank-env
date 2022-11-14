// A simple logger function.
export function logThis(message: string, exit?: number) {
  console.log(message);
  if (exit !== undefined) {
    console.log(); // new line
    process.exit(exit);
  }
}
