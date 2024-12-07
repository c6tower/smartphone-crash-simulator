<script>
import { ref, onMounted } from 'vue'

export default {
  props: {
    msg: String,
  },
  setup() {
    const GRAVITY = 9.8
    const FALL_THRESHOLD = 2.0

    const height = ref(0)
    const heightScore = ref(0)
    const errorMsg = ref('')

    const accelerometerX = ref(0)
    const accelerometerY = ref(0)
    const accelerometerZ = ref(0)

    let startTime = null
    let endTime = null
    let falling = false

    onMounted(() => {
      console.log("onMounted...")

      // if (!('Accelerometer' in window)) {
      //   errorMsg.value = 'Accelerometer not supported'
      //   console.error('Accelerometer not supported')
      //   return
      // }

      const accelerometer = new Accelerometer({ frequency: 60 })

      if ('Accelerometer' in window) {
        console.log("Accelerometer in window")
        accelerometer.addEventListener('reading', () => {
          console.log("reading...")
          // console上で 加速度をみる
          accelerometerX.value = accelerometer.x
          accelerometerY.value = accelerometer.y
          accelerometerZ.value = accelerometer.z
          console.log(accelerometer.x, accelerometer.y, accelerometer.z)
          
          const totalAcceleration = Math.sqrt(
            accelerometer.x ** 2 +
            accelerometer.y ** 2 +
            accelerometer.z ** 2
          )

          // 落下開始の判定
          if (totalAcceleration < FALL_THRESHOLD && !falling) {
            falling = true
            startTime = performance.now()
          }

          // 地面衝突の判定
          if (falling && totalAcceleration > GRAVITY * 2) {
            falling = false
            endTime = performance.now()

            const fallTime = (endTime - startTime) / 1000
            height.value = 0.5 * GRAVITY * fallTime ** 2
            heightScore.value = calculateHeightScore(height.value)
          }

          accelerometer.start()
        })
      } else {
        errorMsg.value = 'Accelerometer not supported'
        console.error('Accelerometer not supported')
      }
    })

    const calculateHeightScore = (h) => {
      if (h < 0.5) return 5
      if (h < 1.0) return 10
      if (h < 1.5) return 15
      return 20
    }

    return {
      accelerometerX,
      accelerometerY,
      accelerometerZ,
      errorMsg,
      height,
      heightScore,
    }
  },
}
</script>

<template>
  <h1>{{ msg }}</h1>
  <div>
    <p v-if="errorMsg">{{ errorMsg }}</p>
    <p v-else-if="heightScore > 0">
      You jumped {{ height.toFixed(2) }} meters high!
      <br>
      Your score is {{ heightScore }}.
    </p>
    <p v-else>
      <span class="read-the-docs">Jump to see your score!</span>
    </p>
  </div>

  <div>
    <p>accelerometerX: {{ accelerometerX }}</p>
    <p>accelerometerY: {{ accelerometerY }}</p>
    <p>accelerometerZ: {{ accelerometerZ }}</p>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
