sap.ui.define(
  [
    'sap/ui/export/library', //
    'sap/ui/export/Spreadsheet',
    'sap/ui/core/Fragment',
  ],
  (
    exportLibrary, //
    Spreadsheet,
    Fragment
  ) => {
    'use strict';

    /**
     * @constant {number} 미신청
     */
    const STATE_IN_PROGRESS0 = 15;
    /**
     * @constant {number} 임시저장
     */
    const STATE_IN_PROGRESS1 = 10;
    /**
     * @constant {number} 결재취소
     */
    const STATE_IN_PROGRESS2 = 90;
    /**
     * @constant {number} 신청완료
     */
    const STATE_APPLY1 = 20;
    /**
     * @constant {number} 담당자 접수
     */
    const STATE_APPLY2 = 30;
    /**
     * @constant {number} 결재 기안
     */
    const STATE_APPLY3 = 50;
    /**
     * @constant {number} 담당자 승인
     */
    const STATE_APPROVE = 40;
    /**
     * @constant {number} 담당자 반려
     */
    const STATE_REJECT1 = 45;
    /**
     * @constant {number} 결재 반려
     */
    const STATE_REJECT2 = 65;
    /**
     * @constant {number} 결재 승인
     */
    const STATE_COMPLETE = 60;
    /**
     * @constant {string}} 의료비 상세내역 승인
     */
    const MED_STATE_COMPLETE = 'P';
    /**
     * @constant {string}} 의료비 상세내역 반려
     */
    const MED_STATE_REJECT = 'F';

    function rem2px(rem) {
      if (rem.endsWith('px')) {
        return parseFloat(rem);
      }
      const fRem = parseFloat(rem);
      if (fRem === 0) {
        return 0;
      }
      return parseFloat($('html').css('font-size')) / fRem;
    }

    return {
      /**************************
       * Functions
       *************************/
      count({ oTable, aRowData, sStatCode = 'ZappStatAl', bHasSumRow = false }) {
        const iVisibleRowCountLimit = this.calculateVisibleRowCount(oTable);
        const iDataLength = bHasSumRow ? (aRowData.length || 1) + 1 : aRowData.length;
        const oOccurCount = _.chain(aRowData)
          .map(sStatCode)
          .countBy()
          .defaults({
            ['']: 0,
            [STATE_IN_PROGRESS0]: 0,
            [STATE_IN_PROGRESS1]: 0,
            [STATE_IN_PROGRESS2]: 0,
            [STATE_APPLY1]: 0,
            [STATE_APPLY2]: 0,
            [STATE_APPLY3]: 0,
            [STATE_APPROVE]: 0,
            [STATE_REJECT1]: 0,
            [STATE_REJECT2]: 0,
            [STATE_COMPLETE]: 0,
          })
          .value();

        return {
          rowCount: Math.min(iVisibleRowCountLimit, iDataLength),
          totalCount: aRowData.length,
          progressCount: oOccurCount[''] + oOccurCount[STATE_IN_PROGRESS0] + oOccurCount[STATE_IN_PROGRESS1] + oOccurCount[STATE_IN_PROGRESS2],
          applyCount: oOccurCount[STATE_APPLY1] + oOccurCount[STATE_APPLY2] + oOccurCount[STATE_APPLY3],
          approveCount: oOccurCount[STATE_APPROVE],
          rejectCount: oOccurCount[STATE_REJECT1] + oOccurCount[STATE_REJECT2],
          completeCount: oOccurCount[STATE_COMPLETE],
        };
      },

      calculateVisibleRowCount(oTable) {
        const iBodyHeight = Math.floor($('body').height()); // body 높이
        const $Table = oTable.$();
        const iOffsetTopOfTbody = Math.ceil($Table.find('.sapUiTableCCnt').offset().top); // Table 데이터 시작행의 border-top으로부터 body 최상단까지의 거리
        const $parentBox = $Table.parents('.sapMFlexBox'); // Table을 감싸고 있는 FlexBox
        const iParentBoxBottom = rem2px($parentBox.css('padding-bottom')) + rem2px($parentBox.css('border-bottom-width'));
        const iRowHeight = oTable.getRowHeight() + 1; // Table에 세팅된 행높이 + 실제 렌더링될 때 더해지는 1픽셀
        const $cardBox = $Table.parents('.vCardBox'); // Table 영역 전체를 감싸고 있는 Box
        const iCardBoxBottom = rem2px($cardBox.css('padding-bottom')) + rem2px($cardBox.css('border-bottom-width'));
        const aCardBoxShadow = $cardBox.css('box-shadow').match(/[^\s\(]+(\(.+\))?/g);
        const iCardBoxShadow = rem2px(aCardBoxShadow[2]) + rem2px(aCardBoxShadow[3]) + rem2px(aCardBoxShadow[4]); // box shadow (v-offset + blur + spread)
        const iVisibleRowCount = Math.floor((iBodyHeight - iOffsetTopOfTbody - iParentBoxBottom - iCardBoxBottom - iCardBoxShadow) / iRowHeight);
        // console.log('calculateVisibleRowCount', { iBodyHeight, iOffsetTopOfTbody, iParentBoxBottom, iCardBoxBottom, iCardBoxShadow, iRowHeight, iVisibleRowCount });
        return iVisibleRowCount;
      },

      export({ oTable, sFileName, aTableData = [], aCustomColumns = [], sStatCode = 'ZappStatAl', sStatTxt = 'ZappStxtAl' }) {
        if (!oTable) return;

        const aExportTableRowData = _.isEmpty(aTableData) ? this._getTableRowData(oTable) : aTableData;

        if (!aExportTableRowData.length) return;

        const oSheet = new Spreadsheet({
          worker: false,
          dataSource: aExportTableRowData,
          fileName: `${sFileName}_${moment().format('YYYYMMDD')}.xlsx`,
          workbook: {
            hierarchyLevel: 'Level',
            columns: _.isEmpty(aCustomColumns)
              ? _.chain(oTable.getColumns())
                  .map((col) => ({
                    ...this._getEdmType(col),
                    property: this._getPropertyPath(col, sStatCode, sStatTxt),
                    label: this._getLabelText(col),
                  }))
                  .reject({ property: '' })
                  .reject({ label: '' })
                  .value()
              : aCustomColumns,
          },
        });

        oSheet.build().finally(function () {
          oSheet.destroy();
        });
      },

      _getTableRowData(oTable) {
        const oTableBinding = oTable.getBinding();
        const oTableBindingContext = oTableBinding.getContext();
        if (oTableBindingContext) {
          return oTableBindingContext.getProperty(oTableBinding.getPath());
        }
        return oTableBinding.getModel().getProperty(oTableBinding.getPath());
      },

      _getEdmType(oColumn) {
        if (!oColumn || !oColumn.getTemplate()) return { type: exportLibrary.EdmType.String };

        const sPropertyTypeName = _.chain(oColumn.getTemplate().mBindingInfos).values().head().get(['parts', 0, 'type', 'sName'], '').value();

        return _.isEqual(sPropertyTypeName, 'CustomDate') ? { type: exportLibrary.EdmType.Date, format: 'yyyy.mm.dd' } : { type: exportLibrary.EdmType.String };
      },

      _getLabelText(oColumn) {
        if (!oColumn) return '';

        const mAggregations = oColumn.mAggregations;

        if (!_.chain(mAggregations).get('label').isEmpty().value()) {
          return oColumn.getLabel().getText();
        } else if (!_.chain(mAggregations).get('multiLabels').isEmpty().value()) {
          return _.chain(oColumn.getMultiLabels())
            .reduce((acc, cur) => [...acc, cur.getText()], [])
            .uniq()
            .join('-')
            .value();
        }

        return '';
      },

      _getPropertyPath(oColumn, sStatCode, sStatTxt) {
        if (!oColumn || !oColumn.getTemplate()) return '';

        const sPropertyPath = _.chain(oColumn.getTemplate().mBindingInfos).values().head().get(['parts', 0, 'path'], '').value();

        return _.isEqual(sPropertyPath, sStatCode) ? sStatTxt : sPropertyPath;
      },

      /**
       * @param {object} o = {
       *   table: sap.ui.table.Table instance
       *   colIndices: rowspan을 적용할 zero-base column index array, 행선택용 checkbox 컬럼 미포함
       *   theadOrTbody: 'thead' or 'tbody'
       * }
       */
      adjustRowSpan({ oTable, aColIndices, sTheadOrTbody, bMultiLabel = false }) {
        if (!aColIndices.length) return;

        oTable.addEventDelegate({
          onAfterRendering() {
            const sTarget = sTheadOrTbody === 'thead' ? 'header' : 'table';
            const sTableId = bMultiLabel ? '-fixed-fixrow' : '';

            aColIndices.forEach((colIndex) => {
              const sId = `#${oTable.getId()}-${sTarget}${sTableId} tbody>tr td:nth-child(${colIndex + 1}):visible`;
              const aTDs = $(sId).get();
              let oPrevTD = aTDs.shift();

              aTDs.forEach((oTD) => {
                const $p = $(oPrevTD);
                const $c = $(oTD);

                if ($c.text() === $p.text()) {
                  $p.attr('rowspan', Number($p.attr('rowspan') || 1) + 1);
                  $c.hide();
                } else {
                  oPrevTD = oTD;
                }
              });

              $(sId)
                .get()
                .forEach((oTD) => {
                  $(oTD)
                    .find('span')
                    .text(_.split($(oTD).text(), '--', 1));
                });
            });
          },
        });
      },
      /**
       * @param  {Array} aTableData - 대상목록
       * @param  {Object} mSumField - 합계 라벨 필드정보 ex) { Field01: '합계' }
       * @param  {Array||RegExp} vCalcProps - 계산 대상 속성키(배열 또는 정규식)
       */
      generateSumRow({ aTableData, mSumField, vCalcProps }) {
        if (aTableData.length < 1) return;

        const mSumProps = _.chain(aTableData[0])
          .keys()
          .map((k) => {
            if ((_.isRegExp(vCalcProps) && vCalcProps.test(k)) || (_.isArray(vCalcProps) && _.includes(vCalcProps, k))) {
              return { [k]: _.sumBy(aTableData, (o) => Number(o[k])) };
            }
          })
          .compact()
          .reduce((a, c) => ({ ...a, ...c }), {})
          .value();

        return { Sumrow: true, ...mSumField, ...mSumProps };
      },

      summaryColspan({ oTable, sStartIndex = '0', aHideIndex = [] }) {
        oTable.addEventDelegate({
          onAfterRendering() {
            const sBottomRowId = _.last(oTable.getRows()).getId();

            $(`#${sBottomRowId}-col${sStartIndex}`).attr('colspan', aHideIndex.length + 1);
            aHideIndex.forEach((idx) => $(`#${sBottomRowId}-col${idx}`).hide());
          },
        });
      },

      setColorColumn({ oTable, mColorMap = {}, bIncludeHeader = false, mHeaderColorMap = {}, bHasSumRow = false }) {
        const aRows = [...oTable.getRows()];

        if (bHasSumRow) aRows.pop(); // delete last

        if (bIncludeHeader) {
          const oColumns = oTable.getColumns();

          if (_.isEmpty(mHeaderColorMap)) {
            _.forOwn(mColorMap, (value, key) => $(`#${_.get(oColumns, key).getId()}`).addClass(value));
          } else {
            _.forOwn(mHeaderColorMap, (value, key) => $(`#${_.get(oColumns, key).getId()}`).addClass(value));
          }
        }

        aRows.forEach((row) => _.forOwn(mColorMap, (value, key) => $(`#${row.getId()}-col${key}`).addClass(value)));
      },

      /**************************
       * Formatter
       *************************/
      rowHighlight(sValue) {
        const vValue = !parseInt(sValue, 10) ? sValue : parseInt(sValue, 10);

        switch (vValue) {
          case STATE_IN_PROGRESS0:
          case STATE_IN_PROGRESS1:
          case STATE_IN_PROGRESS2:
            // 작성중
            return sap.ui.core.IndicationColor.None;
          case STATE_APPLY1:
          case STATE_APPLY2:
          case STATE_APPLY3:
            // 신청
            return sap.ui.core.IndicationColor.Indication03;
          case STATE_APPROVE:
          case MED_STATE_COMPLETE:
            // 승인
            return sap.ui.core.IndicationColor.Indication04;
          case STATE_REJECT1:
          case STATE_REJECT2:
          case MED_STATE_REJECT:
            // 반려
            return sap.ui.core.IndicationColor.Indication02;
          case STATE_COMPLETE:
            // 완료
            return sap.ui.core.IndicationColor.Indication05;
          default:
            return null;
        }
      },

      getStatusValues() {
        return [STATE_IN_PROGRESS1, STATE_IN_PROGRESS2, STATE_APPLY1, STATE_APPLY2, STATE_APPLY3, STATE_APPROVE, STATE_REJECT1, STATE_REJECT2, STATE_COMPLETE];
      },

      StatusTxt(sValue = 0) {
        const vValue = !parseInt(sValue, 10) ? sValue : parseInt(sValue, 10);

        switch (vValue) {
          case STATE_IN_PROGRESS0:
            // 미신청
            return '미신청';
          case STATE_IN_PROGRESS1:
          case STATE_IN_PROGRESS2:
            // 작성중
            return '작성중';
          case STATE_APPLY1:
          case STATE_APPLY2:
          case STATE_APPLY3:
            // 신청
            return '신청';
          case STATE_APPROVE:
          case MED_STATE_COMPLETE:
            // 승인
            return '승인';
          case STATE_REJECT1:
          case STATE_REJECT2:
          case MED_STATE_REJECT:
            // 반려
            return '반려';
          case STATE_COMPLETE:
            // 완료
            return '완료';
          default:
            return '';
        }
      },

      // 시차출퇴근 확정용
      CommuteStatusTxt(sValue = 0) {
        const vValue = !parseInt(sValue, 10) ? sValue : parseInt(sValue, 10);

        switch (vValue) {
          case STATE_IN_PROGRESS0:
            // 미신청
            return '미신청';
          case STATE_APPLY1:
          case STATE_APPLY2:
          case STATE_APPLY3:
            // 신청
            return '신청';
          case STATE_REJECT1:
          case STATE_REJECT2:
          case MED_STATE_REJECT:
            // 확정취소
            return '확정취소';
          case STATE_COMPLETE:
            // 확정
            return '확정';
          default:
            return '';
        }
      },

      onFileListDialog(oEvent) {
        // load asynchronous XML fragment
        const vPath = oEvent.getSource().getBindingContext().getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getViewModel().setProperty('/Data', { busy: true });

        if (!this.byId('listFileDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.fragment.ListFileView',
            controller: this,
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            this.AttachFileAction.setTableFileList(this, oRowData);
            oDialog.open();
          });
        } else {
          this.AttachFileAction.setTableFileList(this, oRowData);
          this.byId('listFileDialog').open();
        }
      },
    };
  }
);
