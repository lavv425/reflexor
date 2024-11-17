# REFLEXOR a Reactive State Library

**Reactive State Library** is a lightweight and versatile library for managing reactive states with optional local persistence using `localStorage`.

## Features

- **Multi-environment compatibility**: Works seamlessly with Node.js, browsers, and AMD systems.
- **Lightweight**: Ideal for projects requiring simple but powerful state management without the overhead of complex libraries.
- **Optional persistence**: Automatically saves states in `localStorage` with unique keys generated using MD5 hashes.
- **Listener support**: Simplifies event management tied to state changes.

## Why Choose Reflexor?

- Suitable for projects of all sizes.
- No external dependencies.
- Perfect for applications requiring reactive state with precise change control.
- Clear and well-documented implementation for developers of all skill levels.

## Installation

Add the library to your project by copying the compiled file or including it through a package manager (if published).

## API Documentation

### `reflex(initialValue, persisted = false, key?)`
Creates a reactive state.

**Parameters**
- `initialValue` *(any)*: The initial value of the state.
- `persisted` *(boolean, optional)*: Indicates whether the state should be persisted in `localStorage`.
- `key` *(string, optional)*: A unique key for identifying the state in `localStorage`.

**Returns**
- A `Proxy` for the reactive state.

---

### `onReflexChange(callback, deps)`
Registers a listener for value changes in one or more Reflex states.

**Parameters**
- `callback` *(function)*: The function to be executed when the value changes. Receives the new value as an argument.
- `deps` *(array)*: List of reactive states to observe.

---

### `onReflexDrop(callback, deps)`
Registers a listener for value removals in one or more Reflex states.

**Parameters**
- `callback` *(function)*: The function to be executed when the value is removed. Receives the previous value as an argument.
- `deps` *(array)*: List of reactive states to observe.

---

### `onReflexReset(callback, deps)`
Registers a listener for resets in one or more Reflex states.

**Parameters**
- `callback` *(function)*: The function to be executed when the value is reset. Receives the initial value as an argument.
- `deps` *(array)*: List of reactive states to observe.

---

### `reset(state)`
Resets a reactive state to its initial value.

**Parameters**
- `state` *(any)*: The reactive state to reset.


## Example Usage

```javascript
// Import the library
// Import the library
const { reflex, onReflexChange, onReflexDrop, onReflexReset, reset, md5 } = reflexor;

// Example 1: Create a Reflex
const counter = reflex(0, true, "app-counter");
// Don't need a key if the state is not persisted
const name = reflex("John Doe");

// Example 2: Attach a listener for value changes
onReflexChange((newValue) => {
  console.log("The new counter value is:", newValue);
}, [counter]);

onReflexChange((newValue) => {
  console.log("The new user name is:", newValue);
}, [name]);

// Example 3: Attach a listener for value drops (delete property)
onReflexDrop((droppedValue) => {
  console.log("The counter value was dropped. Previous value:", droppedValue);
}, [counter]);

onReflexDrop((droppedValue) => {
  console.log("The user name was dropped. Previous value:", droppedValue);
}, [name]);

// Example 4: Attach a listener for state resets
onReflexReset((resetValue) => {
  console.log("The counter value was reset to:", resetValue);
}, [counter]);

onReflexReset((resetValue) => {
  console.log("The user name was reset to:", resetValue);
}, [name]);

// Example 5: Update the reactive state
counter.value = 42;
name.value = "Jane Doe";

// Example 6: Reset the reactive state to its initial value
reset(counter);
reset(name);

// Example 7: Drop (delete) the reactive state value
delete counter.value;
delete name.value;
```