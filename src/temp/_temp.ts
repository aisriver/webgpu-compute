// /Users/didi/work/didi/opensource/emsdk/upstream/emscripten/emcc src/sum.cpp -o src/sum.wasm -s EXPORTED_FUNCTIONS="['sum']"
// /Users/didi/work/didi/opensource/emsdk/upstream/emscripten/emcc src/sum.cpp -o sum.wasm -s EXPORTED_FUNCTIONS="['sum']" -s SIDE_MODULE=1
// /Users/didi/work/didi/opensource/emsdk/upstream/emscripten/emcc src/sum.c -s EXPORTED_FUNCTIONS="['_sum']" -O3 -o sum.wasm
(async () => {
  // 加载 WebAssembly 模块
  const response = await fetch(
    `//gift-pypu-cdn.didistatic.com/static/bigdata_resource/frontend/cn/sum.wasm?t=${new Date().getTime()}`
  );
  const wasmBinary = await response.arrayBuffer();
  const wasmModule = new WebAssembly.Module(wasmBinary);
  const wasmInstance = new WebAssembly.Instance(
    wasmModule
    //     , {
    //     imports: {
    //       sum: (...arg) => {
    //         console.log("arg", arg);
    //       },
    //     },
    //   }
  );
  console.log(
    "wasmInstance.exports.sum",
    wasmInstance.exports.sum,
    wasmInstance.exports,
    // @ts-ignore
    wasmInstance.exports.sum([1, 2, 3], 3)
  );

  // 创建 WebGPU 设备和上下文
  // @ts-ignore
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  const context = canvas.getContext("webgpu");

  // 创建输入数据数组，包含100w个随机整数
  const data = new Int32Array(1000000);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.floor(Math.random() * 100);
  }

  // 创建 WebGPU 缓冲区，并将数据从 JavaScript 传输到 GPU
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage:
      // @ts-ignore
      GPUBufferUsage.MAP_READ |
      // @ts-ignore
      GPUBufferUsage.COPY_DST |
      // @ts-ignore
      GPUBufferUsage.STORAGE,
    mappedAtCreation: true,
  });
  //   await buffer.mapReadAsync();
  new Int32Array(buffer.getMappedRange()).set(data);
  buffer.unmap();

  // 创建 WebGPU Compute Pipeline 和 Bind Group
  const pipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [],
    }),
    compute: {
      module: device.createShaderModule({ code: wasmInstance.exports.sum }),
      entryPoint: "sum",
    },
  });
  const bindGroup = device.createBindGroup({
    entries: [
      {
        binding: 0,
        resource: { buffer },
      },
    ],
    layout: pipeline.getBindGroupLayout(0),
  });

  // 提交 GPU 命令
  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  //   passEncoder.dispatch(1); // 启动计算任务
  //   passEncoder.endPass();
  passEncoder.dispatchWorkgroups(1);
  passEncoder.end();

  // 提交命令队列并等待结果
  const commandBuffer = commandEncoder.finish();
  device.queue.submit([commandBuffer]);

  // 从 GPU 中读取结果
  console.log("buffer", buffer);
  // @ts-ignore
  await buffer.mapAsync(GPUMapMode.READ);
  const result = new Int32Array(buffer.getMappedRange())[0];
  buffer.unmap();

  console.log("求和结果:", result);
})();
