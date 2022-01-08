import Field from 'keystone/fields/types/Field';

module.exports = Field.create({
	displayName: 'NestedField',
	getInitialState () {
		console.log('This #1', this);
	}
});
