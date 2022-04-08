// This file is an logger interface
// options: winston / morgan

export { log };
function log(args: any): void {
  console.log(...args);
}
