sap.ui.define(
  [
    'sap/ui/richtexteditor/RichTextEditor', //
  ],
  function (RichTextEditor) {
    'use strict';

    return RichTextEditor.extend('sap.ui.yesco.control.Editor', {
      renderer: {},

      /**
       * @override
       */
      onAfterRendering() {
        RichTextEditor.prototype.onAfterRendering.apply(this, arguments);

        this.addStyleClass('custom-editor');
      },

      insertContent(sHtml) {
        if (this._oEditor) this._oEditor.execCommand('mceInsertContent', false, sHtml);
      },

      scrollToTop() {
        this._oEditor.getBody().firstChild.scrollIntoView();
      },
    });
  }
);
