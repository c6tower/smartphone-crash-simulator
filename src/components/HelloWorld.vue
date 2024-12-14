<script>
import { ref, onMounted } from 'vue'

import seLevel1 from '/src/assets/se/level_1.mp3'
import seLevel2 from '/src/assets/se/level_2.mp3'
import seLevel3 from '/src/assets/se/level_3.mp3'
import seLevel4 from '/src/assets/se/level_4.mp3'
import seLevel5 from '/src/assets/se/level_5.mp3'

import crack_01 from '/src/assets/img/crack_01.png'
import crack_02 from '/src/assets/img/crack_02.png'
import crack_03 from '/src/assets/img/crack_03.png'
import crack_04 from '/src/assets/img/crack_04.png'
import crack_05 from '/src/assets/img/crack_05.png'

export default {
  props: {
    msg: String,
  },
  setup() {
    const GRAVITY = 9.8
    const FALL_THRESHOLD = 2.0

    const errorMsg = ref('')

    const height = ref(0)
    const totalHeightDamage = ref(0)
    const isUpsideDown = ref(false)
    const totalOrientationDamage = ref(0)
    const totalDamage = ref(0)

    const crackedImg = ref('')

    const accelerometerX = ref(0)
    const accelerometerY = ref(0)
    const accelerometerZ = ref(0)

    class DamageThreshold {
      constructor(limit) {
        this.limit = limit
      }
    }
    const DAMAGE_THRESHOLDS = {
      LEVEL_1: new DamageThreshold(2),
      LEVEL_2: new DamageThreshold(4),
      LEVEL_3: new DamageThreshold(8),
      LEVEL_4: new DamageThreshold(14),
      LEVEL_5: new DamageThreshold(22),
    }

    const AUDIO_MAP = {
      LEVEL_1: new Audio(seLevel1),
      LEVEL_2: new Audio(seLevel2),
      LEVEL_3: new Audio(seLevel3),
      LEVEL_4: new Audio(seLevel4),
      LEVEL_5: new Audio(seLevel5),
    }

    let startTime = null
    let endTime = null
    let falling = false

    // TODO: debug only, remove later
    const orientaionAlpha = ref(0)
    const orientaionBeta = ref(0)
    const orientaionGamma = ref(0)

    const hasUserAction = ref(false)

    // 画面の高さを保持
    const containerHeight = ref('100vh')
    const TEXTS = {
      start_msg: 'これはジョークアプリです。スマホが傷まないようお気をつけください。また、音量にご注意ください。',
      need_reset: '修復しますか……？',
      devicemotion_not_supported: 'お使いの端末は加速度センサーに対応していません。',
      devicemotion_not_allowed: '加速度センサーの使用が許可されませんでした。',
      deviceorientation_not_supported: 'お使いの端末はジャイロセンサーに対応していません。',
      deviceorientation_not_allowed: 'ジャイロセンサーの使用が許可されませんでした。',
      request_permission: '加速度センサーとジャイロセンサーの使用を許可する。',
    }

    const params = new URLSearchParams(window.location.search)
    const showDebug = params.has('debug') === true || false

    const permissionGranted = ref(false)

    const requestPermission = async () => {
      try {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          const response = await DeviceMotionEvent.requestPermission()
          if (response !== 'granted') {
            errorMsg.value = TEXTS.devicemotion_not_allowed
            console.error(errorMsg.value)
            return
          }
        }

        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          const response = await DeviceOrientationEvent.requestPermission()
          if (response !== 'granted') {
            errorMsg.value = TEXTS.deviceorientation_not_allowed
            console.error(errorMsg.value)
            return
          }
        }

        permissionGranted.value = true
      } catch (e) {
        console.error(e)
        errorMsg.value = TEXTS.devicemotion_not_allowed + TEXTS.deviceorientation_not_allowed
      }
    }

    const initDeviceSensor = () => {
      if ('DeviceMotionEvent' in window) {
        window.addEventListener('devicemotion', handleMotion)
      } else {
        errorMsg.value = TEXTS.devicemotion_not_supported
        console.error(errorMsg.value)
      }

      if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', handleOrientation)
      } else {
        errorMsg.value = TEXTS.deviceorientation_not_supported
        console.error(errorMsg.value)
      }

      if (typeof DeviceMotionEvent.requestPermission !== 'function'
        && typeof DeviceOrientationEvent.requestPermission !== 'function'
      ) {
        permissionGranted.value = true
      }
    }

    const initContentHeight = () => {
      // 画面の高さを取得
      containerHeight.value = `${window.innerHeight}px`
      window.addEventListener('resize', () => {
        containerHeight.value = `${window.innerHeight}px`
      })
    }

    // アクセス時に音声再生を許可するための処理
    const initAudio = () => {
      Object.values(AUDIO_MAP).forEach((audio) => {
        audio.load()
      })
    }

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
      } else if (falling && totalAcceleration > GRAVITY * 2) {
        falling = false
        endTime = performance.now()

        const fallTime = (endTime - startTime) / 1000
        height.value = 0.5 * GRAVITY * fallTime ** 2

        triggerCollisionEvent()
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

    // 衝突を検知した際の処理
    const triggerCollisionEvent = () => {
      const heightDamage = calculateHeightDamage(height.value)
      const orientationDamage = calculateOrientationDamage(isUpsideDown.value)

      totalHeightDamage.value += heightDamage
      totalOrientationDamage.value += orientationDamage
      totalDamage.value = totalHeightDamage.value + totalOrientationDamage.value

      if (totalDamage.value >= DAMAGE_THRESHOLDS.LEVEL_5.limit) {
        console.log('Explosion!')
        playExplosionSound()
      } else {
        playSoundEffect(heightDamage + orientationDamage)
      }

      drawCrack()
    }

    /* スコア計算ロジック */
    const calculateHeightDamage = (h) => {
      if (h < 0.2) return 0
      if (h < 0.5) return 1
      if (h < 1.0) return 2
      if (h < 1.5) return 3
      if (h < 2.0) return 4
      return 5
    }
    const calculateOrientationDamage = (isUpsideDown) => {
      return isUpsideDown ? 2 : 0
    }

    /* 効果音ロジック */
    /** スコアに応じた効果音を再生
     * 効果音なし: score = 0
     * level1: 軽いダメージ
     * level2: 画面が下向きであればlevel2以上にする
     * level3: それなりの高さ + 画面が下向きのケース
     * level4: かなりひどいケース
     */
    const playSoundEffect = (score) => {
      console.log('playSoundEffect:', score)
      let audio
      if (score < 1) {
        return
      } else if (score < 2) {
        audio = AUDIO_MAP.LEVEL_1
      } else if (score < 4) {
        audio = AUDIO_MAP.LEVEL_2
      } else if (score < 5) {
        audio = AUDIO_MAP.LEVEL_3
      } else {
        audio = AUDIO_MAP.LEVEL_4
      }
      audio.currentTime = 0
      audio.play()
    }
    const playExplosionSound = () => {
      let audio = AUDIO_MAP.LEVEL_5
      audio.currentTime = 0
      audio.play()
    }

    const resetDamage = () => {
      totalHeightDamage.value = 0
      totalOrientationDamage.value = 0
      totalDamage.value = 0

      // TODO: ここで背景画像リセットは暫定処理なので改善する
      crackedImg.value = ''
    }

    /* ひび割れ描画ロジック */
    const drawCrack = () => {
      let img_path = ''
      if (totalDamage.value < DAMAGE_THRESHOLDS.LEVEL_1.limit) {
        img_path = ''
      } else if (totalDamage.value < DAMAGE_THRESHOLDS.LEVEL_2.limit) {
        img_path = crack_01
      } else if (totalDamage.value < DAMAGE_THRESHOLDS.LEVEL_3.limit) {
        img_path = crack_02
      } else if (totalDamage.value < DAMAGE_THRESHOLDS.LEVEL_4.limit) {
        img_path = crack_03
      } else if (totalDamage.value < DAMAGE_THRESHOLDS.LEVEL_5.limit) {
        img_path = crack_04
      } else {
        img_path = crack_05
      }
      crackedImg.value = `url(${img_path})`
    }

    /* debug用ロジック */
    const isDebug = ref(false)
    const debugToggle = () => {
      isDebug.value = !isDebug.value
    }
    const debugAddHeightScore = () => {
      totalHeightDamage.value++
    }
    const debugAddOrientationScore = () => {
      totalOrientationDamage.value++
    }
    const debugTriggerCollide = () => {
      triggerCollisionEvent()
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

    onMounted(() => {
      initContentHeight()
      initAudio()
      initDeviceSensor()
    })

    return {
      DAMAGE_THRESHOLDS,
      accelerometerX,
      accelerometerY,
      accelerometerZ,
      containerHeight,
      crack_02,
      errorMsg,
      height,
      totalHeightDamage,
      isDebug,
      orientaionAlpha,
      orientaionBeta,
      orientaionGamma,
      totalOrientationDamage,
      resetDamage,
      totalDamage,
      debugAddHeightScore,
      debugAddOrientationScore,
      debugTriggerCollide,
      debugFormatDecimal,
      debugToggle,
      crackedImg,
      TEXTS,
      requestPermission,
      permissionGranted,
      showDebug,
      hasUserAction,
    }
  },
}
</script>

<template>
  <div
    :style="{height: containerHeight, backgroundImage: crackedImg}"
    class="background-container"
  >
    <div
      v-if="!hasUserAction"
      class="mini-container"
    >
      <h1>{{ msg }}</h1>
      <button
        v-if="!permissionGranted"
        class="request-permission-btn"
        @click="requestPermission()"
      >
        {{ TEXTS.request_permission }}
      </button>

      <button
        v-if="permissionGranted && !hasUserAction"
        @click="hasUserAction = true"
        class="request-permission-btn"
      >
        {{ TEXTS.start_msg }}
      </button>
    </div>

    <div
      v-if="hasUserAction"
      class="mini-container"
    >
      <button
        v-if="showDebug"
        class="debug-button"
        @click="debugToggle()"
      >
        isDebug: {{ isDebug }}
      </button>

      <h1>{{ msg }}</h1>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      <p v-else>
        Current Damage to Your Smartphone: {{ totalDamage }}
      </p>

      <button
        v-if="totalDamage >= DAMAGE_THRESHOLDS.LEVEL_5.limit * 1.1"
        @click="resetDamage()"
        class="reset-button"
      >
        {{TEXTS.need_reset}}
      </button>

      <p v-if="totalHeightDamage > 0">
        Height of the Drop (meters): {{ height.toFixed(2) }}
      </p>

      <div v-show="isDebug">
        <div>
          <button @click="debugAddHeightScore()">add height score</button>
          <br>
          <button @click="debugAddOrientationScore()">add orientation score</button>
          <br>
          <button @click="debugTriggerCollide()">TriggerCollided</button>
        </div>

        <div>
          <p>accelerometerX: {{ accelerometerX }}</p>
          <p>accelerometerY: {{ accelerometerY }}</p>
          <p>accelerometerZ: {{ accelerometerZ }}</p>
          <p>totalHeightDamage: {{ totalHeightDamage }}</p>
        </div>

        <div>
          <p>orientaion (A, B, G): {{ debugFormatDecimal(orientaionAlpha) }}, {{ debugFormatDecimal(orientaionBeta) }}, {{ debugFormatDecimal(orientaionGamma) }}</p>
          <p>totalOrientationDamage: {{ totalOrientationDamage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.background-container {
  width: 100%;
  /* background-image: url('/src/assets/img/crack_02.png'); */
  background-position: left bottom;
  background-repeat: no-repeat;
  background-size: 230% auto;

  display: flex;
  /* 子要素を中央揃えにする */
  align-items: center;
  justify-content: normal;
}
.read-the-docs {
  color: #888;
}

.mini-container {
  width: 100%;
}

.debug-button {
  /* 左上固定 */
  position: fixed;
  top: 20px;
  right: 10px;
}

.reset-button {
  background-color: rgba(255, 0, 0, 0.5);
  border: 2px double #fff;
  color: #fff;
  font-size: 1.5em;
  font-weight: bold;
}

.request-permission-btn {
  background-color: rgba(0, 0, 255, 0.5);
  border: 2px double #fff;
  color: #fff;
  font-size: 1.2em;
  font-weight: bold;
  width: 80%;
}

.error-msg {
  color: #ff0000;
}
</style>
