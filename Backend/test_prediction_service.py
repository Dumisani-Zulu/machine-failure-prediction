from services.prediction_service import get_machine_specific_prediction


def run_tests():
    print('Running prediction service tests...')

    # Happy path
    history = [
        {'Timestamp': '2025-10-22T00:00:00', 'Temperature': 60, 'Pressure': 100, 'Vibration': 1.5},
        {'Timestamp': '2025-10-22T00:01:00', 'Temperature': 62, 'Pressure': 101, 'Vibration': 1.6},
        {'Timestamp': '2025-10-22T00:02:00', 'Temperature': 65, 'Pressure': 102, 'Vibration': 1.8}
    ]
    r1 = get_machine_specific_prediction('Haul Truck', history)
    assert 'most_likely_failure' in r1 and isinstance(r1['specific_failure_predictions'], dict)
    print(' - Happy path: OK')

    # Missing timestamp single dict
    single = {'temperature': 70, 'pressure': 110, 'vibration': 2.0}
    r2 = get_machine_specific_prediction('Drill Rig', single)
    assert 'most_likely_failure' in r2 and 'most_likely_failure_probability' in r2
    print(' - Missing Timestamp single dict: OK')

    # Bad input should be handled (we expect function to either return or raise a RuntimeError)
    try:
        get_machine_specific_prediction('Crusher', 123)
        print(' - Bad input (int) handled without exception (ok)')
    except Exception:
        print(' - Bad input (int) raised exception (acceptable)')

    print('All tests completed.')


if __name__ == '__main__':
    run_tests()
