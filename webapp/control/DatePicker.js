sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/DatePicker',
    'sap/ui/yesco/common/AppUtils',
  ],
  function (
    // prettier 방지용 주석
    sapMDatePicker,
    AppUtils
  ) {
    'use strict';

    class DatePicker extends sapMDatePicker {
      _createPopup() {
        super._createPopup();

        this._oPopup.getBeginButton().setText(AppUtils.getAppController().getText('LABEL_01005')); // 오늘

        const endButton = this._oPopup.getEndButton();
        if (endButton) {
          endButton.setVisible(false);
        }
      }

      _createPopupContent() {
        super._createPopupContent();

        this._oPopup.getBeginButton().setEnabled(true);
      }

      _handleOKButton() {
        this._oCalendar.focusDate(new Date());
      }

      _handleCalendarSelect() {
        this._selectDate();
      }
    }

    return DatePicker;
  }
);
