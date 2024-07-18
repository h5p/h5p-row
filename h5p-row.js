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

    /**
     * Get xAPI data from children
     * 
     * The contract function getXAPIData is not implemented here, as Row
     * is only used as a subcontent, and special handling needs to occur to
     * prevent needless clutter in the final xAPI statement.
     * 
     * @return {Array} Array of the children of the contained columns
     * and their xAPI statements.
     */
    self.getXAPIDataFromChildren = function () {
      return instances.flatMap(function (child) {
        if (typeof child.getXAPIData == 'function') {
          return child.getXAPIData().children;
        }
      }).filter(data => !!data);
    }

    /**
     * Get answer given
     * Contract.
     *
     * @return {boolean} True, if all answers have been given.
     */
    self.getAnswerGiven = function () {
      return instances.reduce(function (prev, instance) {
        return prev && (instance.getAnswerGiven ? instance.getAnswerGiven() : prev);
      }, true);
    };

    /**
     * Get instances for all children
     *
     * @return {Object[]} array of instances
     */
    self.getInstances = function () {
      return instances;
    };

    /**
     * Get title, e.g. for xAPI
     *
     * @return {string} Title.
     */
    self.getTitle = function () {
      return H5P.createTitle((self.contentData && self.contentData.metadata && self.contentData.metadata.title) ? self.contentData.metadata.title : '');
    };

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
