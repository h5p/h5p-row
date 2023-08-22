H5P.Row = (function (EventDispatcher) {

  /**
   * Row Constructor
   *
   * @class
   * @param {Object} params Describes task behavior
   * @param {number} id Content identifier
   * @param {Object} data User specific data to adapt behavior
   */
  function Row(params, id, data) {
    /** @alias H5P.Row# */
    var self = this;

    // We support events by extending this class
    EventDispatcher.call(self);

    // Add defaults
    params = params || {};

    // Wrapper element
    var wrapper;

    /**
     * Create the HTML for the content type the first time it's attached to
     * the DOM.
     *
     * @private
     */
    var createHTML = function () {
      // Create wrapper
      wrapper = document.createElement('div');
      wrapper.classList.add('h5p-row');

      for (var i = 0; i < params.columns.length; i++) {
        var column = document.createElement('div');
        var columnData = params.columns[i];

        column.classList.add('h5p-column');

        if (columnData.width) {
          column.style.width = columnData.width;
        }

        var h5pRunnable = H5P.newRunnable(columnData.content, columnData.content.subContentId);
        h5pRunnable.attach(H5P.jQuery(column));

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

      // Add to DOM
      $container.addClass('h5p-row').html('').append(wrapper);
    };

    // TODO: Add required xAPI stuff once we get child instances
  }

  Row.prototype = Object.create(EventDispatcher.prototype);
  Row.prototype.constructor = Row;

  return Row;
})(H5P.EventDispatcher);
