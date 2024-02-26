export const nonObjects = [
    false, true,
    0, 1, -1, 0.5, -0.5,
    '', 'Hello, world.',
    0n, 1n, 1_000_000_000_000_000_000_000_000_000_000n,
    Symbol(), Symbol('Example'),
    [], [1, 2, 3, 4, 5], [
        'Arrays are not considered objects by isObject',
        'This is to prevent silly things like trying to observe an array with thousands of elements',
        'Or the fact that observation would most definitely break many important array features'
    ]
];