sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/DateRangeSelection',
    'sap/m/ButtonType',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    DateRangeSelection,
    ButtonType,
    JSONModel,
    AppUtils
  ) => {
    'use strict';

    /**
     * '오늘' 버튼 기능을 구현한 DateRangeSelection
     * ResponsivePopover Footer의 '확인' 버튼을 감추고 '취소' 버튼을 '오늘' 버튼으로 오버라이딩
     */
    return DateRangeSelection.extend('sap.ui.yesco.control.DateRangeSelection', {
      renderer: {},

      constructor: function (...aArgs) {
        DateRangeSelection.apply(this, aArgs);

        let sPatternModelPath;

        const oBindingValueType = (this.getBindingInfo('value') || this.getBindingInfo('dateValue') || {}).type;
        if (oBindingValueType && (oBindingValueType.getName() || '').startsWith('Custom') && (oBindingValueType.oFormatOptions || {}).pattern) {
          const sModelName = `datePatternModel-${this.getId()}`;
          AppUtils.getAppComponent().setModel(new JSONModel({ Dtfmt: oBindingValueType.oFormatOptions.pattern }), sModelName);

          sPatternModelPath = `${sModelName}>/Dtfmt`;
        } else {
          sPatternModelPath = 'appointeeModel>/Dtfmt';
        }

        this.setShowFooter(true)
          .bindProperty('valueFormat', sPatternModelPath)
          .bindProperty('displayFormat', sPatternModelPath)
          // .bindProperty('placeholder', `${sPatternModelPath} - ${sPatternModelPath}`)
          .addStyleClass('sapIcon_Date');
      },

      _createPopup() {
        DateRangeSelection.prototype._createPopup.apply(this);

        this._oPopup.getBeginButton().setVisible(false);

        const sTodayText = AppUtils.getBundleText('LABEL_01001'); // 오늘
        const oEndButton = this._oPopup.getEndButton();
        if (oEndButton) {
          oEndButton.setType(ButtonType.Emphasized).setText(sTodayText);
        } else {
          this._oPopup.setEndButton(
            new sap.m.Button({
              text: sTodayText,
              type: ButtonType.Emphasized,
              press: this._handleCancelButton.bind(this),
            })
          );
        }
      },

      _handleCancelButton() {
        this._oCalendar.focusDate(new Date());
      },

      _handleCalendarSelect() {
        this._selectDate();
      },
    });
  }
);
