<script>
import { ref, onMounted, watch } from 'vue'
import seLevel1 from '/src/assets/se/level_1.mp3'
import seLevel2 from '/src/assets/se/level_2.mp3'
import seLevel3 from '/src/assets/se/level_3.mp3'
import seLevel4 from '/src/assets/se/level_4.mp3'
import seLevel5 from '/src/assets/se/level_5.mp3'

export default {
  props: {
    msg: String,
  },
  setup() {
    const GRAVITY = 9.8
    const FALL_THRESHOLD = 2.0

    const errorMsg = ref('')

    const height = ref(0)
    const heightScore = ref(0)
    const isUpsideDown = ref(false)
    const orientationScore = ref(0)
    const totalScore = ref(0)

    const hasCollided = ref(false)

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
        // TODO: add Permission API for iOS
        window.addEventListener('devicemotion', handleMotion)
      } else {
        errorMsg.value = 'お使いの端末は加速度センサーに対応していません。'
        console.error(errorMsg.value)
      }

      // TODO: debug only, remove later
      if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', handleOrientation)
      } else {
        errorMsg.value = 'お使いの端末はジャイロセンサーに対応していません。'
        console.error(errorMsg.value)
      }
    })

    // 衝突を検知した際の処理
    watch(hasCollided, (newVal) => {
      if (newVal) {
        heightScore.value += calculateHeightScore(height.value)
        orientationScore.value += calculateOrientationScore(isUpsideDown.value)
        totalScore.value = heightScore.value + orientationScore.value

        console.log('heightScore:', heightScore.value)
        console.log('orientationScore:', orientationScore.value)
        console.log('totalScore:', totalScore.value)

        hasCollided.value = false
      }
    })

    watch(totalScore, (newVal) => {
      playSoundEffect(newVal)
    })

    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity
      if (!acc) return

      // TODO: debug only, remove later
      accelerometerX.value = acc.x
      accelerometerY.value = acc.y
      accelerometerZ.value = acc.z

      const totalAcceleration = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2)

      // 落下開始/終了の判定
      if (totalAcceleration < FALL_THRESHOLD && !falling) {
        falling = true
        startTime = performance.now()
        isUpsideDown.value = false
      } else if (falling && totalAcceleration > GRAVITY * 2) {
        falling = false
        endTime = performance.now()

        const fallTime = (endTime - startTime) / 1000
        height.value = 0.5 * GRAVITY * fallTime ** 2

        // 落下時に画面が地面に向いていたかどうかの判定
        if (orientaionBeta.value < -170 || orientaionBeta.value > 170) {
          isUpsideDown.value = true
        }

        hasCollided.value = true
        // TODO: triggerCollisionEvent() を実装しても良いかも
      }
    }

    const handleOrientation = (event) => {
      orientaionAlpha.value = event.alpha
      orientaionBeta.value = event.beta
      orientaionGamma.value = event.gamma

      if (orientaionBeta.value < -170 || orientaionBeta.value > 170) {
        isUpsideDown.value = true
      } else {
        isUpsideDown.value = false
      }
    }

    const calculateHeightScore = (h) => {
      if (h < 0.2) return 0
      if (h < 0.5) return 1
      if (h < 1.0) return 2
      if (h < 1.5) return 3
      if (h < 2.0) return 4
      return 5
    }

    const calculateOrientationScore = (isUpsideDown) => {
      return isUpsideDown ? 1 : 0
    }

    const playSoundEffect = (score) => {
      const audio = new Audio()
      if (score < 5) {
        audio.src = seLevel1
      } else if (score < 10) {
        audio.src = seLevel2
      } else if (score < 15) {
        audio.src = seLevel3
      } else if (score < 20) {
        audio.src = seLevel4
      } else {
        audio.src = seLevel5
      }
      audio.play()
    }

    const isDebug = ref(false)
    const debugAddHeightScore = () => {
      heightScore.value++
    }
    const debugAddOrientationScore = () => {
      orientationScore.value++
    }
    const debugHasCollided = () => {
      if (hasCollided.value) {
        hasCollided.value = false
      } else {
        hasCollided.value = true
      }
    }
    // 小数点以下の桁数を指定し、桁数に応じて0埋めした文字列を返す
    const debugFormatDecimal = (num, intDesit = 3, decimalDesit = 2) => {
      const ajustedNum = Math.floor(num * 10 ** decimalDesit) / 10 ** decimalDesit
      let [intStr, decimalStr] = ajustedNum.toString().split('.')
      intStr = intStr.padStart(intDesit, '0')
      if (!decimalStr) decimalStr = '0'.repeat(decimalDesit)
      decimalStr = decimalStr.padEnd(decimalDesit, '0')
      return `${intStr}.${decimalStr}`
    }


    return {
      accelerometerX,
      accelerometerY,
      accelerometerZ,
      errorMsg,
      height,
      heightScore,
      isDebug,
      orientaionAlpha,
      orientaionBeta,
      orientaionGamma,
      orientationScore,
      totalScore,
      debugAddHeightScore,
      debugAddOrientationScore,
      debugHasCollided,
      debugFormatDecimal,
      hasCollided,
    }
  },
}
</script>

<template>
  <h1>{{ msg }}</h1>
  <div>
    <p v-if="errorMsg">{{ errorMsg }}</p>
    <p v-else>
      Current Damage to Your Smartphone: {{ totalScore }}
    </p>

    <p v-if="heightScore > 0">
      Height of the Drop (meters): {{ height.toFixed(2) }}
    </p>
  </div>

  <div>
    <input type="checkbox" v-model="isDebug"> Debug Mode
  </div>
  <div v-show="isDebug">
    <div>
      <button @click="debugAddHeightScore">add height score</button>
      <br>
      <button @click="debugAddOrientationScore">add orientation score</button>
      <br>
      <button @click="debugHasCollided">hasCollided: {{ hasCollided }}</button>
    </div>

    <div>
      <p>accelerometerX: {{ accelerometerX }}</p>
      <p>accelerometerY: {{ accelerometerY }}</p>
      <p>accelerometerZ: {{ accelerometerZ }}</p>
      <p>heightScore: {{ heightScore }}</p>
    </div>

    <div>
      <p>orientaion (A, B, G): {{ debugFormatDecimal(orientaionAlpha) }}, {{ debugFormatDecimal(orientaionBeta) }}, {{ debugFormatDecimal(orientaionGamma) }}</p>
      <p>orientationScore: {{ orientationScore }}</p>
    </div>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
