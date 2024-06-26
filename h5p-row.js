H5P.Row = (function (EventDispatcher) {

  /**
   * Row Constructor
   *
   * @class
   * @param {Object} params Describes task behavior
   * @param {number} rootId Content identifier
   * @param {Object} data User specific data to adapt behavior
   */
  function Row(params, rootId, data) {
    /** @alias H5P.Row# */
    const self = this;

    // We support events by extending this class
    EventDispatcher.call(self);

    // Add defaults
    params = params || {};

    // Wrapper element
    let wrapper;

    // Columns in the row
    const instances = [];

    // Track the containers to be used by each column
    const instanceContainers = [];

    /**
     * Create the HTML for the content type the first time it's attached to
     * the DOM.
     *
     * @private
     */
    const createHTML = function () {
      // Create wrapper
      wrapper = document.createElement('div');
      wrapper.classList.add('h5p-row-wrapper');

      for (let i = 0; i < params.columns.length; i++) {
        const column = document.createElement('div');
        const columnData = params.columns[i];

        column.classList.add('h5p-row-content');
        if (columnData.width) {
          column.style.width = columnData.width + '%';
        }

        if (columnData.paddings) {
          const unit =  columnData.paddings.unit;
          column.style.paddingTop = columnData.paddings.top + unit;
          column.style.paddingBottom = columnData.paddings.bottom + unit;
          column.style.paddingLeft = columnData.paddings.left + unit;
          column.style.paddingRight = columnData.paddings.right + unit;
        }

        const instance = H5P.newRunnable(columnData.content, rootId);

        // Bubble resize events received from column
        bubbleUp(instance, 'resize', self);

        // Keep track of all instances
        instances.push(instance);
        instanceContainers.push({
          hasAttached: false,
          container: column,
          instanceIndex: instances.length - 1,
        });

        wrapper.appendChild(column);
      }

    };

    /**
     * Attach the content to the given container
     *
     * @param {H5P.jQuery} $container
     */
    self.attach = function ($container) {
      if (wrapper === undefined) {
        // Create wrapper and content
        createHTML();
      }

      instanceContainers.filter(function (container) { return !container.hasAttached })
        .forEach(function (container) {
          instances[container.instanceIndex]
            .attach(H5P.jQuery(container.container));
        });

      // Add to DOM
      $container.addClass('h5p-row').html('').append(wrapper);
    };

    // TODO: Add required xAPI stuff once we get child instances

    // Resize children to fit inside parent
    bubbleDown(self, 'resize', instances);
  }

  Row.prototype = Object.create(EventDispatcher.prototype);
  Row.prototype.constructor = Row;

  /**
   * Makes it easy to bubble events from parent to children
   *
   * @private
   * @param {Object} origin Origin of the Event
   * @param {string} eventName Name of the Event
   * @param {Array} targets Targets to trigger event on
   */
  function bubbleDown(origin, eventName, targets) {
    origin.on(eventName, function (event) {
      if (origin.bubblingUpwards) {
        return; // Prevent send event back down.
      }

      for (var i = 0; i < targets.length; i++) {
        targets[i].trigger(eventName, event);
      }
    });
  }

  /**
   * Makes it easy to bubble events from child to parent
   *
   * @private
   * @param {Object} origin Origin of the Event
   * @param {string} eventName Name of the Event
   * @param {Object} target Target to trigger event on
   */
  function bubbleUp(origin, eventName, target) {
    origin.on(eventName, function (event) {
      // Prevent target from sending event back down
      target.bubblingUpwards = true;

      // Trigger event
      target.trigger(eventName, event);

      // Reset
      target.bubblingUpwards = false;
    });
  }

  return Row;
})(H5P.EventDispatcher);
