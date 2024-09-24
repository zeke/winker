import Replicate from 'replicate'
import download from 'download'
import { readFile, mkdir, rm } from 'node:fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
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
const iterations = 25

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

// Create video from stills with FFMPEG
async function createVideo () {
  const inputPattern = path.join(outputsDir, 'output-%02d.webp')
  const outputFile = path.join(process.cwd(), 'output.mp4')
  const ffmpegCommand = `ffmpeg -framerate 20 -i "${inputPattern}" -filter_complex "[0:v]reverse[r];[0:v][r]concat,loop=1:250,setpts=N/50/TB" -c:v libx264 -pix_fmt yuv420p ${outputFile}`

  console.log('Starting video creation with ffmpeg...')

  try {
    const { stdout, stderr } = await execAsync(ffmpegCommand)
    console.log('Video creation completed successfully.')
    if (stdout) console.log('ffmpeg output:', stdout)
    if (stderr) console.error('ffmpeg errors:', stderr)
  } catch (error) {
    console.error('Error creating video:', error)
  }
}

createVideo()
