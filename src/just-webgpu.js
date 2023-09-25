(async () => {
  console.time();
  // 创建一个GPU适配器
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  // 创建一个GPU缓冲区，用于存储数据
  const inputBuffer = device.createBuffer({
    size: 1000000 * 4, // 100w个整数，每个整数占4字节
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    // usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    // usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  // usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, // | GPUBufferUsage.MAP_WRITE,
  const outputBufferSize = 1000000 * 4;
  const outputBuffer = device.createBuffer({
    size: outputBufferSize,
    // usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    // usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const destinationOutputBuffer = device.createBuffer({
    size: outputBufferSize,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  // 创建一个计算Shader模块
  const computeShaderCode = `
    @group(0) @binding(0) var<storage, read> inputData: array<u32>;
    
    @group(0) @binding(1) var<storage, read_write> outputData: u32;

    @compute @workgroup_size(1)
    fn main() {
        var sum: u32 = 0;
    
        // 计算数组中元素的总和
        var length = arrayLength(&inputData);
        for (var i: u32 = 0; i < length; i = i + 1) {
            sum = sum + inputData[i];
        }
    
        outputData = sum;
    }
    `;
  const computeShaderModule = device.createShaderModule({
    code: computeShaderCode,
  });

  // 创建一个计算管线
  const pipeline = device.createComputePipeline({
    // layout: device.createPipelineLayout({
    //   bindGroupLayouts: [],
    // }),
    layout: "auto",
    compute: {
      module: computeShaderModule,
      entryPoint: "main",
    },
  });

  // 将数据拷贝到GPU缓冲区中
  const data = new Uint32Array(1000000);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.floor(Math.random() * 100);
  }
  device.queue.writeBuffer(inputBuffer, 0, data.buffer);

  // const bindGroupLayout = device.createBindGroupLayout({
  //   entries: [
  //     {
  //       binding: 0,
  //       visibility: GPUShaderStage.COMPUTE,
  //       buffer: {
  //         type: "read-only-storage",
  //       },
  //     },
  //     {
  //       binding: 1,
  //       visibility: GPUShaderStage.COMPUTE,
  //       buffer: {
  //         type: "storage",
  //       },
  //     },
  //   ],
  // });

  // 创建一个绑定组
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        // visibility: GPUShaderStage.COMPUTE,
        resource: {
          buffer: inputBuffer,
          offset: 0,
          size: 1000000 * 4,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: outputBuffer,
        },
      },
    ],
  });

  // 提交计算任务
  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.dispatchWorkgroups(1);
  passEncoder.end();

  commandEncoder.copyBufferToBuffer(outputBuffer, 0, destinationOutputBuffer, 0, outputBufferSize);

  // 提交命令
  device.queue.submit([commandEncoder.finish()]);

  // 从GPU中读取结果
  // 如果需要在 GPU 计算期间频繁地访问和修改
  // await inputBuffer.mapAsync(GPUMapMode.READ);
  // const inputArr = new Uint32Array(inputBuffer.getMappedRange())[0];
  // inputBuffer.unmap();
  // console.log("inputBuffer index 0:", inputArr);

  await destinationOutputBuffer.mapAsync(GPUMapMode.READ);
  const outputValue = new Uint32Array(destinationOutputBuffer.getMappedRange())[0];
  destinationOutputBuffer.unmap();
  // 在执行完 GPU 计算后
  // 如果只是想在 GPU 计算后获取 outputData 的值，而不需要在 CPU 上对缓冲区进行频繁的读写操作
  // const resultBuffer = await adapter.queue.readBuffer(outputBuffer, 0, 4);
  // const resultArray = new Uint32Array(resultBuffer);
  // const outputValue = resultArray[0];
  console.log("求和结果:", outputValue);
  console.timeEnd();
})();
