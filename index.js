import Replicate from 'replicate'
import download from 'download'
import { readFile, mkdir } from 'node:fs/promises'
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

// Create outputs directory
const outputsDir = path.join(process.cwd(), 'outputs')
await mkdir(outputsDir, { recursive: true })

// Generate images
for (let i = 0; i < 25; i++) {
  input.wink = i
  console.log('wink', i)
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
  const ffmpegCommand = `ffmpeg -framerate 10 -i "${inputPattern}" -filter_complex "[0:v]reverse[r];[0:v][r]concat,loop=1:250,setpts=N/25/TB" -c:v libx264 -pix_fmt yuv420p ${outputFile}`

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
