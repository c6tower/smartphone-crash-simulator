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

    // TODO: debug only, remove later
    const orientaionAlpha = ref(0)
    const orientaionBeta = ref(0)
    const orientaionGamma = ref(0)

    onMounted(() => {
      if ('DeviceMotionEvent' in window) {
        console.log("DeviceMotionEvent in window")
        // TODO: add Permission API for iOS
        window.addEventListener('devicemotion', handleMotion)
      } else {
        errorMsg.value = 'DeviceMotionEvent is not supported.'
        console.error(errorMsg.value)
      }

      // TODO: debug only, remove later
      if ('DeviceOrientationEvent' in window) {
        console.log("DeviceOrientationEvent in window")
        window.addEventListener('deviceorientation', handleOrientation)
      } else {
        errorMsg.value = 'DeviceOrientationEvent is not supported.'
        console.error(errorMsg.value)
      }
    })

    const handleMotion = (event) => {
      console.log("handleMotion...")
      const acc = event.accelerationIncludingGravity
      if (!acc) return

      // TODO: debug only, remove later
      accelerometerX.value = acc.x
      accelerometerY.value = acc.y
      accelerometerZ.value = acc.z
      console.log("acc.x: ", acc.x)
      console.log("acc.y: ", acc.y)
      console.log("acc.z: ", acc.z)

      const totalAcceleration = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2)

      // 落下開始の判定
      if (totalAcceleration < FALL_THRESHOLD && !falling) {
        falling = true
        startTime = performance.now()
      } else if (falling && totalAcceleration > GRAVITY * 2) {
        falling = false
        endTime = performance.now()

        const fallTime = (endTime - startTime) / 1000
        height.value = 0.5 * GRAVITY * fallTime ** 2
        heightScore.value = calculateHeightScore(height.value)
      }
    }

    const handleOrientation = (event) => {
      orientaionAlpha.value = event.alpha
      orientaionBeta.value = event.beta
      orientaionGamma.value = event.gamma
    }

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
      orientaionAlpha,
      orientaionBeta,
      orientaionGamma,
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

  <div>
    <p>orientaionAlpha: {{ orientaionAlpha }}</p>
    <p>orientaionBeta: {{ orientaionBeta }}</p>
    <p>orientaionGamma: {{ orientaionGamma }}</p>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
