console.time();
const data = [];
for (let i = 0; i < 1000000; i++) {
  data[i] = Math.floor(Math.random() * 100);
}

var sum = 0;
// 计算数组中元素的总和
var length = data.length;
for (var i = 0; i < length; i = i + 1) {
  sum = sum + data[i];
}
console.log("sum", sum);
console.timeEnd();
