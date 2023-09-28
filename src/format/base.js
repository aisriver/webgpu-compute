const data = [...window.testData];
console.time();
// 每个元素*100
var length = data.length;
for (var i = 0; i < length; i = i + 1) {
  data[i] = data[i] * 100;
}
console.log("format index 0:", data[0]);
console.timeEnd();
