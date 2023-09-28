const startTime = performance.now();
var sum = 0;
// 计算数组中元素的总和
var length = window.testData.length;
for (var i = 0; i < length; i = i + 1) {
  sum = sum + window.testData[i];
}
console.log("sum", sum);
const endTime = performance.now();
console.log(`Execution time: ${endTime - startTime} ms`);
