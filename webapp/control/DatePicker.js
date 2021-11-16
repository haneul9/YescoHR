sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/DatePicker',
    'sap/m/ButtonType',
    'sap/ui/yesco/common/AppUtils',
  ],
  function (
    // prettier 방지용 주석
    sapMDatePicker,
    ButtonType,
    AppUtils
  ) {
    ('use strict');

    /**
     * '오늘' 버튼 기능을 구현한 DatePicker
     * ResponsivePopover Footer의 '확인' 버튼을 감추고 '취소' 버튼을 '오늘' 버튼으로 오버라이딩
     */
    class DatePicker extends sapMDatePicker {
      _createPopup() {
        super._createPopup();

        this._oPopup.getBeginButton().setVisible(false);

        const sTodayText = AppUtils.getAppController().getText('LABEL_01005'); // 오늘
        const oEndButton = this._oPopup.getEndButton();
        if (oEndButton) {
          oEndButton.setType(ButtonType.Emphasized).setText(sTodayText);
        } else {
          this._oPopup.setEndButton(
            new Button({
              text: sTodayText,
              type: ButtonType.Emphasized,
              press: this._handleCancelButton.bind(this),
            })
          );
        }
      }

      _handleCancelButton() {
        this._oCalendar.focusDate(new Date());
      }

      _handleCalendarSelect() {
        this._selectDate();
      }
    }

    return DatePicker;
  }
);