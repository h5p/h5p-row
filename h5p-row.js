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
    const self = this;

    // We support events by extending this class
    EventDispatcher.call(self);

    // Add defaults
    params = params || {};

    // Wrapper element
    let wrapper;

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

        const h5pRunnable = H5P.newRunnable(columnData.content, columnData.content.subContentId);
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
