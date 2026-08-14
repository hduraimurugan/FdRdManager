// Jest manual mock for @react-native-community/datetimepicker — the native picker has no
// Jest-environment implementation. Renders nothing; DateTimePickerAndroid.open is a no-op.

function DateTimePicker() {
  return null;
}

DateTimePicker.default = DateTimePicker;
DateTimePicker.DateTimePickerAndroid = {
  open: jest.fn(),
  dismiss: jest.fn(async () => true),
};

module.exports = DateTimePicker;
