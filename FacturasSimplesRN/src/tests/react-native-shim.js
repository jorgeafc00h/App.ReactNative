const React = require('react');

function host(name) {
  return function HostComponent(props) {
    const { children, ...rest } = props || {};
    return React.createElement(name, rest, children);
  };
}

const View = host('div');
const Text = host('span');
const TouchableOpacity = host('button');
const Modal = host('div');
const TextInput = (props) => React.createElement('input', props);

const FlatList = ({ data = [], renderItem, keyExtractor }) => {
  return React.createElement(
    'div',
    null,
    data.map((item, index) => {
      const key = keyExtractor ? keyExtractor(item, index) : index;
      return React.createElement('div', { key }, renderItem({ item, index }));
    })
  );
};

module.exports = {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  // basic exports used in many places
  Platform: { OS: 'web' },
  NativeModules: {},
  StyleSheet: {
    create: (s) => s,
    // simple flatten implementation used by testing helpers
    flatten: (style) => {
      if (!style) return style;
      if (Array.isArray(style)) {
        return Object.assign({}, ...style.map((s) => (s ? s : {})));
      }
      return style;
    },
  },
};
