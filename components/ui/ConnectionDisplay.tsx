import { getCarConnected, getConnectionState, getLastUpdateTime, VehicleConnectionState } from "@/store/connectionSlice"
import { selectMetricValue } from "@/store/metricsSlice"
import React, { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Icon, Text } from "react-native-paper"
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated"
import { useSelector } from "react-redux"
import { numericalUnitConvertor } from "../utils/numericalUnitConverter"

const GREEN = "#00ff00ff"
const ORANGE = "#ff8000ff"
const YELLOW = "#ffff00ff"
const RED = "#ff0000ff"

export function ConnectionDisplay(): React.JSX.Element {
  let color;
  let flashing;

  const source = 'antenna'
  const opacity = useSharedValue(0.7);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 500 }),
      -1,
      true
    );
  }, []);

  const connectionState = useSelector(getConnectionState)
  const carConnected = useSelector(getCarConnected)

  if (connectionState == VehicleConnectionState.CONNECTED) {
    if (carConnected) {
      color = GREEN
      flashing = false
    } else {
      color = ORANGE
      flashing = true
    }
  } else if (connectionState == VehicleConnectionState.AUTHENTICATING) {
    flashing = true
    color = YELLOW
  } else {
    color = RED
    flashing = true
  }

  if (flashing) {
    return (
      <Animated.View style={animatedStyle}>
        <Icon source={source} size={20} color={color} />
      </Animated.View>
    )
  }
  return <Icon source={source} size={20} color={color} />
}

export function ConnectionText() {
  const { t } = useTranslation()
  const lastUpdated = useSelector(getLastUpdateTime)
  const vEAwake = useSelector(selectMetricValue("v.e.awake12"))

  const connectionState = useSelector(getConnectionState)
  const carConnected = useSelector(getCarConnected)

  const dataAgeSeconds = Date.now() / 1000 - lastUpdated

  let textContent;
  let textColor = "white";

  let displayText
  try {
    let displayAge = numericalUnitConvertor(dataAgeSeconds).from("s").toBest({ exclude: ['ms', 'ns', 'mu', 'year'] })!
    displayAge.val = Math.floor(displayAge.val)

    //@ts-ignore
    if (displayAge.unit == 's') {
      displayText = t("live")
    } else {
      displayText = `${displayAge.val} ${t(displayAge.val == 1 ? displayAge.singular : displayAge.plural)}`
    }
  } catch (error) {
    console.log(error)
    textColor = RED
    displayText = error
  }


  if (connectionState == VehicleConnectionState.CONNECTED) {
    if (carConnected) {
      textContent = `${vEAwake ? t('Awake') : t('Sleeping')}, ${displayText}`
      textColor = "white"
    } else {
      textColor = ORANGE
      textContent = t("Vehicle disconnected") + " " + displayText
    }
  } else if (connectionState == VehicleConnectionState.AUTHENTICATING) {
    textContent = t("Authenticating...")
    textColor = YELLOW
  } else {
    textContent = t("Connecting...")
    textColor = RED
  }

  return <Text style={{ color: textColor }}>{textContent}</Text>
}
