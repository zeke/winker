import Replicate from 'replicate'
import download from 'download'
import { readFile, mkdir, rm } from 'node:fs/promises'
import path from 'path'
import videoshow from 'videoshow'
import getImageSize from 'image-size'

const replicate = new Replicate()
const model = 'fofr/expression-editor:bf913bc90e1c44ba288ba3942a538693b72e8cc7df576f3beebe56adc0a92b86'
const input = {
  wink: 0,
  image: await readFile(path.resolve(process.cwd(), 'zeke.jpg'))
}

// Remove existing outputs
const outputsDir = path.join(process.cwd(), 'outputs')
await rm(outputsDir, { recursive: true, force: true })

// (Re)create outputs directory
await mkdir(outputsDir, { recursive: true })

const maxWink = 25
const maxSmile = 1.3
const iterations = 12

// Generate images
for (let i = 0; i < iterations; i++) {
  input.wink = maxWink * i / iterations
  input.smile = maxSmile * i / iterations
  console.log(i, { input })

  const output = await replicate.run(model, { input })
  console.log({ output })
  console.log('\n\n')
  const filename = `output-${i.toString().padStart(2, '0')}.webp`
  await download(output[0], outputsDir, { filename })
}

// Create video from stills with videoshow
async function createVideo () {
  const images = Array.from({ length: iterations }, (_, i) =>
    path.join(outputsDir, `output-${i.toString().padStart(2, '0')}.webp`)
  )

  // Get the size of the first image
  const firstImageSize = await getImageSize(images[0])
  const size = `${firstImageSize.width}x${firstImageSize.height}`

  const videoOptions = {
    loop: 1 / 12,
    transition: false,
    // videoBitrate: 1024,
    // videoCodec: 'libx264',
    size,
    format: 'mp4',
    pixelFormat: 'yuv420p'
  }

  const outputFile = path.join(process.cwd(), 'output.mp4')

  videoshow(images, videoOptions)
    .save(outputFile)
    .on('start', function (command) {
    //   console.log('ffmpeg process started:', command)
    })
    .on('error', function (err, stdout, stderr) {
      console.error('Error:', err)
      console.error('ffmpeg stderr:', stderr)
    })
    .on('end', function (output) {
      console.log('Video created successfully:', output)
    })
}

createVideo()
