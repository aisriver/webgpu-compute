(async () => {
  // 创建一个GPU适配器
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  console.time();
  // 创建一个GPU缓冲区，用于存储数据
  const inputBuffer = device.createBuffer({
    size: window.arraySize * 4, // xx个整数，每个整数占4字节
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const outputBufferSize = window.arraySize * 4;
  const outputBuffer = device.createBuffer({
    size: outputBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const destinationOutputBuffer = device.createBuffer({
    size: outputBufferSize,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const workgroupNum = {
    x: 256,
    y: 1,
    z: 1,
  };
  const workgroupSize = {
    x: 256,
    y: 1,
    z: 1,
  };
  const allWorkerNum =
    workgroupNum.x *
    workgroupNum.y *
    workgroupNum.y *
    workgroupSize.x *
    workgroupSize.y *
    workgroupSize.z;
  const groupLength = Math.ceil(window.arraySize / allWorkerNum);

  // 创建一个计算Shader模块
  const computeShaderCode = `
    @group(0) @binding(0) var<storage, read> inputData: array<u32>;
    
    @group(0) @binding(1) var<storage, read_write> outputData: array<u32>;

    @compute @workgroup_size(${workgroupSize.x}, ${workgroupSize.y}, ${workgroupSize.z})
    fn main(@builtin(global_invocation_id) invocation_id: vec3<u32>) {
        // var length = arrayLength(&inputData);
        var length: u32 = ${window.arraySize};
        var invocationIndex = invocation_id.x;
        var startIndex = invocationIndex * ${groupLength};
        var endIndex = startIndex + ${groupLength};
        if (endIndex > length) {
          endIndex = length;
        }
        for (var i: u32 = startIndex; i < endIndex; i = i + 1) {
          outputData[invocationIndex] = inputData[invocationIndex] * 100;
        }
    }
    `;
  const computeShaderModule = device.createShaderModule({
    code: computeShaderCode,
  });

  // 创建一个计算管线
  const pipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module: computeShaderModule,
      entryPoint: "main",
    },
  });

  // 将数据拷贝到GPU缓冲区中
  const data = new Uint32Array(window.testData);
  device.queue.writeBuffer(inputBuffer, 0, data.buffer);

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
          size: window.arraySize * 4,
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
  const startTime = performance.now();
  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  // 工作组数量 x y z
  // @workgroup_size 里面的是每个工作组下线程数量 x y z
  passEncoder.dispatchWorkgroups(
    workgroupNum.x,
    workgroupNum.y,
    workgroupNum.z
  );
  passEncoder.end();

  commandEncoder.copyBufferToBuffer(
    outputBuffer,
    0,
    destinationOutputBuffer,
    0,
    outputBufferSize
  );

  // 提交命令
  device.queue.submit([commandEncoder.finish()]);

  await device.queue.onSubmittedWorkDone();
  const endTime = performance.now();
  console.log(`Execution time: ${endTime - startTime} ms`);

  await destinationOutputBuffer.mapAsync(GPUMapMode.READ);
  const arr = new Uint32Array(destinationOutputBuffer.getMappedRange());
  console.log("format index 0:", arr[0]);
  destinationOutputBuffer.unmap();
  console.timeEnd();
})();
