/*global define*/

define(
    [],
    function () {
        'use strict';


        /**
         * Implements "save" and "cancel" as capabilities of
         * the object. In editing mode, user is seeing/using
         * a copy of the object (an EditableDomainObject)
         * which is disconnected from persistence; the Save
         * and Cancel actions can use this capability to
         * propagate changes from edit mode to the underlying
         * actual persistable object.
         *
         * Meant specifically for use by EditableDomainObject and the
         * associated cache; the constructor signature is particular
         * to a pattern used there and may contain unused arguments.
         */
        return function EditorCapability(
            persistenceCapability,
            editableObject,
            domainObject,
            cache
        ) {

            // Simulate Promise.resolve (or $q.when); the former
            // causes a delayed reaction from Angular (since it
            // does not trigger a digest) and the latter is not
            // readily accessible, since we're a few classes
            // removed from the layer which gets dependency
            // injection.
            function resolvePromise(value) {
                return (value && value.then) ? value : {
                    then: function (callback) {
                        return resolvePromise(callback(value));
                    }
                };
            }

            // Update the underlying, "real" domain object's model
            // with changes made to the copy used for editing.
            function doMutate() {
                return domainObject.useCapability('mutation', function () {
                    return editableObject.getModel();
                });
            }

            // Persist the underlying domain object
            function doPersist() {
                return persistenceCapability.persist();
            }

            return {
                /**
                 * Save any changes that have been made to this domain object
                 * (as well as to others that might have been retrieved and
                 * modified during the editing session)
                 * @param {boolean} nonrecursive if true, save only this
                 *        object (and not other objects with associated changes)
                 * @returns {Promise} a promise that will be fulfilled after
                 *          persistence has completed.
                 */
                save: function (nonrecursive) {
                    return nonrecursive ?
                            resolvePromise(doMutate()).then(doPersist) :
                            resolvePromise(cache.saveAll());
                },
                /**
                 * Cancel editing; Discard any changes that have been made to
                 * this domain object (as well as to others that might have
                 * been retrieved and modified during the editing session)
                 * @returns {Promise} a promise that will be fulfilled after
                 *          cancellation has completed.
                 */
                cancel: function () {
                    return resolvePromise(undefined);
                }
            };
        };
    }
);