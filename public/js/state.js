export const initialState = {
    automation: { pump: { enabled: false, threshold: 30 }, mist: { enabled: false, threshold: 50 } },
    sensors: { soil: 0, temp: 0, humidity: 0, tank: 0, light: 0, mq135: 0 },
    devices: { pump: 0, uv: 0, mist: 0, buzzer: 0 },
    alarmReason: null,
    pinnedKey: null,
    mq135_ref: null // Added explicit init for rate-of-rise ref
};
