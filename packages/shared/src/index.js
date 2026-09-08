/**
 * Shared constants, defaults, and schemas for Gardenist Smart Garden IoT.
 */

export const SENSOR_KEYS = ['soil', 'temp', 'humidity', 'tank', 'light', 'mq135'];

export const SENSOR_DEFAULTS = {
    soil: 0,
    temp: 0,
    humidity: 0,
    tank: 0,
    light: 0,
    mq135: 0
};

export const DEVICE_KEYS = ['pump', 'uv', 'mist', 'buzzer'];

export const VIEW_KEYS = ['overview', 'automation', 'logs', 'devices', 'eco'];

export const SENSOR_THRESHOLDS = {
    soil: { min: 40, max: 80, unit: '%' },
    humidity: { min: 50, max: 75, unit: '%' },
    temp: { min: 20, max: 32, unit: '°C' },
    light: { min: 300, max: 2000, unit: 'Lx' },
    mq135: { min: 0, max: 400, unit: 'PPM' },
    tank: { min: 25, max: 100, unit: '%' }
};

export const RTDB_PATHS = {
    sensors: 'sensors',
    controls: 'controls',
    automation: 'automation',
    logs: 'logs',
    nodes: 'nodes'
};
