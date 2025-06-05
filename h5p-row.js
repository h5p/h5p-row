H5P.Row = (function (EventDispatcher) {
  const ROW_WIDTH = 100;
  const MINIMUM_COLUMN_SIZE = 10;

  function addMissingWidthsToColumns(columns) {
    let remainingWidth = 100;
    let amountOfNoWidths = 0;
    columns.forEach((c) => {
      if (typeof c.width !== 'undefined'
          && c.width >= MINIMUM_COLUMN_SIZE
          && c.width <= ROW_WIDTH) {
        remainingWidth -= c.width;
      } else {
        // Reset width if it was set to something invalid.
        c.width = undefined;
        amountOfNoWidths++;
      }
    });
    if (amountOfNoWidths > 0) {
      const adjustedColumns = columns.map((c) => {
        if (typeof c.width === 'undefined') {
          c.width = Math.max(MINIMUM_COLUMN_SIZE, remainingWidth / amountOfNoWidths);
        }
        return c
      });
      return adjustedColumns;
    }

    return columns;
  }

  function autoAdjustColumnWidths (columns) {
    const totalWidth = columns.reduce((sum, column) => {
      if (Number.isFinite(column.width)) {
        sum += column.width;
      }
      return sum;
    }, 0);

    if (totalWidth !== ROW_WIDTH) {
      const addToMiddle = !Number.isInteger(ROW_WIDTH / columns.length);
      const rest = ROW_WIDTH - Math.floor(ROW_WIDTH / columns.length) * columns.length;
      const middlePoint = (columns.length / 2) - 1;
      for (let i = 0; i < columns.length; i++) {
        if (addToMiddle && i === middlePoint) {
          columns[i].width = Math.floor(ROW_WIDTH / columns.length) + rest;
        } else {
          columns[i].width = Math.floor(ROW_WIDTH / columns.length);
        }
      }
    }
    return columns;
  }

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
    params.columns = params.columns || [];

    // Remove empty columns
    params.columns = params.columns.filter(column => {
      // Check if column is not null/undefined and has any properties
      return column && Object.keys(column).length > 0;
    });

    params.columns = addMissingWidthsToColumns(params.columns);
    params.columns = autoAdjustColumnWidths(params.columns);
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
          column.style.flexBasis = columnData.width + '%';
          column.classList.add('h5p-row-content-fixed-width');
        }

        const instance = H5P.newRunnable(columnData.content, rootId, undefined, true, grabContentData(i));

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
     * Get data for content at given index, like previous state
     *
     * @private
     * @param {number} index
     * @returns {Object} Data object with previous state
     */
    const grabContentData = function (index) {
      var contentData = {
        parent: self
      };

      if (data.previousState && data.previousState.instances && data.previousState.instances[index]) {
        contentData.previousState = data.previousState.instances[index];
      }

      return contentData;
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
     * Get score for all children
     * Contract used for getting the complete score of task.
     *
     * @return {number} Score for questions
     */
    self.getScore = function () {
      return instances.reduce(function (prev, instance) {
        return prev + (instance.getScore ? instance.getScore() : 0);
      }, 0);
    };

    /**
     * Get maximum score possible for all children instances
     * Contract.
     *
     * @return {number} Maximum score for questions
     */
    self.getMaxScore = function () {
      return instances.reduce(function (prev, instance) {
        return prev + (instance.getMaxScore ? instance.getMaxScore() : 0);
      }, 0);
    };

    /**
     * Show solutions.
     * Contract.
     */
    self.showSolutions = function () {
      instances.forEach(function (instance) {
        if (instance.toggleReadSpeaker) {
          instance.toggleReadSpeaker(true);
        }
        if (instance.showSolutions) {
          instance.showSolutions();
        }
        if (instance.toggleReadSpeaker) {
          instance.toggleReadSpeaker(false);
        }
      });
    };

    /**
     * Reset task.
     * Contract.
     */
    self.resetTask = function () {
      instances.forEach(function (instance) {
        if (instance.resetTask) {
          instance.resetTask();
        }
      });
    };

    /**
     * Create object containing information about the current state
     * of this content.
     *
     * @return {Object}
     */
    self.getCurrentState = function () {
      // Get previous state object or create new state object
      var state = (data.previousState ? data.previousState : {});
      if (!state.instances) {
        state.instances = [];
      }

      // Grab the current state for each instance
      for (var i = 0; i < instances.length; i++) {
        var instance = instances[i];

        if (instance.getCurrentState instanceof Function ||
            typeof instance.getCurrentState === 'function') {

          state.instances[i] = instance.getCurrentState();
        }
      }

      return state;
    };

    /**
     * Get title
     *
     * @return {string} Title.
     */
    self.getTitle = function () {
      return H5P.createTitle((self.contentData && self.contentData.metadata && self.contentData.metadata.title) ? self.contentData.metadata.title : '');
    };

    // Allow instances to be available before row is attached
    if (wrapper === undefined) {
      // Create wrapper and content
      createHTML();
    }

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
