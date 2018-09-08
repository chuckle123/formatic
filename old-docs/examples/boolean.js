// Use bootstrap plugin.
var config = Formatic.createConfig(Formatic.plugins.bootstrap);

// Create some fields.
var fields = [
  {
    type: 'boolean',
    key: 'happy',
    label: 'Are you happy?'
  },
  {
    type: 'boolean',
    key: 'isOptIn',
    label: 'Subscribe to our newsletter?',
    choices: [
      {
        value: true,
        label: 'Absolutely!'
      },
      {
        value: false,
        label: 'No way!'
      }
    ]
  }
];

// Render the form.
React.render(
  <Formatic config={config} fields={fields} onChange={this.onChangeValue}/>
, mountNode);
