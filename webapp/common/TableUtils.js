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

    return {
      /**************************
       * Functions
       *************************/
      count({ oTable, aRowData, sStatCode = 'ZappStatAl', bHasSumRow = false }) {
        const iBodyHeight = $('body').height(); // 화면 높이
        const iOffsetTopOfTbody = oTable.$().find('.sapUiTableCCnt').offset().top; // Table 데이터 시작행의 화면 최상단까지의 거리
        const iParentFlexBoxPaddingBottom = parseInt(oTable.$().parents('.sapMFlexBox').css('padding-bottom'), 10); // Table을 감싸고 있는 FlexBox의 아래 padding
        const iRowHeight = oTable.getRowHeight(); // Table에 세팅된 행높이
        const iVisibleRowCountLimit = Math.floor((iBodyHeight - iOffsetTopOfTbody - iParentFlexBoxPaddingBottom) / iRowHeight);
        const iDataLength = bHasSumRow ? (aRowData.length || 1) + 1 : aRowData.length;
        const aZappStatAls = _.map(aRowData, sStatCode);
        const oOccurCount = _.defaults(_.countBy(aZappStatAls), {
          [STATE_IN_PROGRESS1]: 0,
          [STATE_IN_PROGRESS2]: 0,
          [STATE_APPLY1]: 0,
          [STATE_APPLY2]: 0,
          [STATE_APPLY3]: 0,
          [STATE_APPROVE]: 0,
          [STATE_REJECT1]: 0,
          [STATE_REJECT2]: 0,
          [STATE_COMPLETE]: 0,
        });

        return {
          rowCount: iVisibleRowCountLimit > iDataLength ? iDataLength : iVisibleRowCountLimit,
          totalCount: aZappStatAls.length,
          progressCount: oOccurCount[STATE_IN_PROGRESS1] + oOccurCount[STATE_IN_PROGRESS2],
          applyCount: oOccurCount[STATE_APPLY1] + oOccurCount[STATE_APPLY2] + oOccurCount[STATE_APPLY3],
          approveCount: oOccurCount[STATE_APPROVE],
          rejectCount: oOccurCount[STATE_REJECT1] + oOccurCount[STATE_REJECT2],
          completeCount: oOccurCount[STATE_COMPLETE],
        };
      },

      export({ oTable, aTableData, sFileName, sStatCode = 'ZappStatAl', sStatTxt = 'ZappStxtAl', aDateProps = [] }) {
        if (!aTableData.length) return;

        const sToday = moment().format('YYYYMMDD');
        const mColumns = oTable.getColumns().map((col) => ({
          label: col.getLabel().getText(),
          property: !!col.getTemplate().getBindingInfo('text')
            ? col.getTemplate().getBindingInfo('text').parts[0].path === sStatCode
              ? sStatTxt
              : col.getTemplate().getBindingInfo('text').parts[0].path
            : col.getTemplate().getBindingInfo('visible').parts[0].path,
          type: exportLibrary.EdmType.String,
        }));

        aDateProps.forEach((prop) => {
          const mDateColumn = _.find(mColumns, { property: prop });

          mDateColumn.type = exportLibrary.EdmType.Date;
          mDateColumn.format = 'yyyy.mm.dd';
        });

        const oSettings = {
          workbook: {
            columns: mColumns,
            hierarchyLevel: 'Level',
          },
          dataSource: aTableData,
          fileName: `${sFileName}_${sToday}.xlsx`,
          worker: false,
        };

        const oSheet = new Spreadsheet(oSettings);
        oSheet.build().finally(function () {
          oSheet.destroy();
        });
      },

      /**
       * @param {object} o = {
       * 		table: sap.ui.table.Table instance
       * 		colIndices: rowspan을 적용할 zero-base column index array, 행선택용 checkbox 컬럼 미포함
       * 		theadOrTbody: 'thead' or 'tbody'
       * 	}
       */
      adjustRowSpan(o) {
        if (!o.colIndices.length) return;

        o.table.addEventDelegate(
          {
            onAfterRendering() {
              const target = o.theadOrTbody === 'thead' ? 'header' : 'table';
              o.colIndices.forEach((colIndex) => {
                const sId = `#${o.table.getId()}-${target} tbody>tr td:nth-child(${colIndex + 1}):visible`;
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
              });
            },
          },
          o.table
        );
      },

      generateSumRow({ aTableData, sSumProp, sSumLabel, aCalcProps = [], rCalcProp }) {
        if (aTableData.length < 1) return;

        return aTableData.reduce(
          (acc, cur) => {
            for (var prop in cur) {
              const iCalcPropValue = _.defaultTo(Number(cur[prop]), 0);

              if (rCalcProp instanceof RegExp) {
                if (acc.hasOwnProperty(prop) && rCalcProp.test(prop)) {
                  acc[prop] += iCalcPropValue;
                } else {
                  if (rCalcProp.test(prop)) {
                    acc[prop] = iCalcPropValue;
                  } else {
                    acc[prop] = sSumProp === prop ? sSumLabel : null;
                  }
                }
              } else {
                if (acc.hasOwnProperty(prop) && _.includes(aCalcProps, prop)) {
                  acc[prop] += iCalcPropValue;
                } else {
                  if (_.includes(aCalcProps, prop)) {
                    acc[prop] = iCalcPropValue;
                  } else {
                    acc[prop] = sSumProp === prop ? sSumLabel : null;
                  }
                }
              }
            }
            return acc;
          },
          { Sumrow: true, [sSumProp]: sSumLabel }
        );
      },

      summaryColspan({ oTable, sStartIndex = '0', aHideIndex = [] }) {
        oTable.addEventDelegate({
          onAfterRendering() {
            const sBottomRowId = _.last(oTable.getRows()).getId();
            const $firstTD = $(`#${sBottomRowId}-col${sStartIndex}`);

            $firstTD.attr('colspan', aHideIndex.length + 1);
            aHideIndex.forEach((idx) => $(`#${sBottomRowId}-col${idx}`).hide());
          },
        });
      },

      setColorColumn({ oTable, mColorMap = {}, bHasSumRow = false }) {
        const aRows = [...oTable.getRows()];

        if (bHasSumRow) aRows.pop(); // delete last

        aRows.forEach((row) => {
          const sRowId = row.getId();

          _.forOwn(mColorMap, (value, key) => $(`#${sRowId}-col${key}`).addClass(value));
        });
      },

      /**************************
       * Formatter
       *************************/
      rowHighlight(sValue) {
        switch (parseInt(sValue, 10)) {
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
            // 승인
            return sap.ui.core.IndicationColor.Indication04;
          case STATE_REJECT1:
          case STATE_REJECT2:
            // 반려
            return sap.ui.core.IndicationColor.Indication02;
          case STATE_COMPLETE:
            // 완료
            return sap.ui.core.IndicationColor.Indication05;
          default:
            return null;
        }
      },

      StatusTxt(sValue = 0) {
        switch (parseInt(sValue, 10)) {
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
            // 승인
            return '승인';
          case STATE_REJECT1:
          case STATE_REJECT2:
            // 반려
            return '반려';
          case STATE_COMPLETE:
            // 완료
            return '완료';
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
            oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
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
