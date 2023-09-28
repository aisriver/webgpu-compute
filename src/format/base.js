const data = [...window.testData];
const startTime = performance.now();
// 每个元素*100
var length = data.length;
for (var i = 0; i < length; i = i + 1) {
  data[i] = data[i] * 100;
}
console.log("format index 0:", data[0]);
const endTime = performance.now();
console.log(`Execution time: ${endTime - startTime} ms`);
