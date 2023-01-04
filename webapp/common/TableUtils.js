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
     * @constant {number} 완료
     */
    const STATE_COMPLETE2 = 1;
    /**
     * @constant {number} 진행
     */
    const STATE_IN_PROGRESS3 = 2;
    /**
     * @constant {number} 계획
     */
    const STATE_IN_PLAN = 3;
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
    /**
     * @constant {number} CSR신청단계
     */
    const STATE_CSR_APPLY = 'CSR10';
    /**
     * @constant {number} CSR처리단계
     */
    const STATE_CSR_PROGRESS = 'CSR20';
    /**
     * @constant {number} CSR완료단계
     */
    const STATE_CSR_COMPLETE = 'CSR30';

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

      getCount({ oTable, aRowData, sStatCode = 'ZappStatAl', bHasSumRow = false }) {
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
          visibleRows: Math.min(iVisibleRowCountLimit, iDataLength),
          total: aRowData.length,
          progress: oOccurCount[''] + oOccurCount[STATE_IN_PROGRESS0] + oOccurCount[STATE_IN_PROGRESS1] + oOccurCount[STATE_IN_PROGRESS2],
          request: oOccurCount[STATE_APPLY1] + oOccurCount[STATE_APPLY2] + oOccurCount[STATE_APPLY3],
          approve: oOccurCount[STATE_APPROVE],
          reject: oOccurCount[STATE_REJECT1] + oOccurCount[STATE_REJECT2],
          complete: oOccurCount[STATE_COMPLETE],
        };
      },

      calculateVisibleRowCount(oTable) {
        const iBodyHeight = Math.floor($('body').height()); // body 높이
        const $Table = oTable.$();
        const iOffsetTopOfTbody = Math.ceil($Table.find('.sapUiTableCCnt').offset().top); // Table 데이터 시작행의 border-top으로부터 body 최상단까지의 거리
        const $ParentBox = $Table.parents('.sapMFlexBox'); // Table을 감싸고 있는 FlexBox
        const iParentBoxBottom = rem2px($ParentBox.css('padding-bottom')) + rem2px($ParentBox.css('border-bottom-width'));
        const iRowHeight = oTable.getRowHeight() + 1; // Table에 세팅된 행높이 + 실제 렌더링될 때 더해지는 1픽셀
        const $CardBox = $Table.parents('.vCardBox'); // Table 영역 전체를 감싸고 있는 Box
        const iCardBoxBottom = rem2px($CardBox.css('padding-bottom')) + rem2px($CardBox.css('border-bottom-width'));
        const aCardBoxShadow = $CardBox.css('box-shadow').match(/[^\s\(]+(\(.+\))?/g);
        const iCardBoxShadow = rem2px(aCardBoxShadow[2]) + rem2px(aCardBoxShadow[3]) + rem2px(aCardBoxShadow[4]); // box shadow (v-offset + blur + spread)
        const iVisibleRowCount = Math.floor((iBodyHeight - iOffsetTopOfTbody - iParentBoxBottom - iCardBoxBottom - iCardBoxShadow) / iRowHeight);
        // console.log('calculateVisibleRowCount', { iBodyHeight, iOffsetTopOfTbody, iParentBoxBottom, iCardBoxBottom, iCardBoxShadow, iRowHeight, iVisibleRowCount });
        return iVisibleRowCount;
      },

      getSelectionData(oTable) {
        const oTableRows = oTable.getBinding('rows');
        const aSelectedIndices = oTable.getSelectedIndices();

        return (
          _.chain(oTableRows.getContexts(0, oTableRows.getLength()))
            .filter((o, i) => _.includes(aSelectedIndices, i))
            .map((o) => ({ ...o.getObject() }))
            .value() ?? []
        );
      },

      export({ oTable, sFileName, aTableData = [], aCustomColumns = [], sStatCode = 'ZappStatAl', sStatTxt = 'ZappStxtAl' }) {
        if (!oTable) return;

        const aExportTableRowData = _.isEmpty(aTableData) ? this._getTableRowData(oTable) : aTableData;

        if (!aExportTableRowData.length) return;

        const i9Hours = 9 * 60 * 60 * 1000;
        const oSheet = new Spreadsheet({
          worker: false,
          dataSource: _.map(aExportTableRowData, (o) => {
            return _.forOwn(o, (v, p) => {
              if (_.isObject(v) && _.has(v, 'ms')) _.set(o, p, moment(v.ms - i9Hours).format('HH:mm'));
            });
          }),
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
          return _.cloneDeep(oTableBindingContext.getProperty(oTableBinding.getPath()));
        }
        return _.cloneDeep(oTableBinding.getModel().getProperty(oTableBinding.getPath()));
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
       *   oTable: sap.ui.table.Table instance
       *   aColIndices: rowspan을 적용할 zero-base column index array, 행선택용 checkbox 컬럼 미포함
       *   sTheadOrTbody: 'thead' or 'tbody'
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
              let $pTD = $(aTDs.shift());

              aTDs.forEach((oTD) => {
                const $cTD = $(oTD);
                if ($cTD.text() === $pTD.text()) {
                  $pTD.attr('rowspan', Number($pTD.attr('rowspan') || 1) + 1);
                  $cTD.hide();
                } else {
                  $pTD = $cTD;
                }
              });

              $(sId)
                .get()
                .forEach((oTD) => {
                  const $c = $(oTD);
                  $c.find('span').text(() => _.split($c.text(), '--', 1));
                });
            });
          },
        });
      },
      /**
       * sap.ui.table.Column의 headerSpan 속성을 적용할 경우 버그가 있어 강제로 colspan을 적용함
       * 버그 : colspan 대상이 되는 column들 중 visible이 false인 column이 포함되면 해당 컬럼 앞에서 span이 잘림
       */
      adjustHeaderColSpan(oTable) {
        oTable.addEventDelegate(
          {
            onAfterRendering() {
              const aTDs = $(`#${this.getId()}-header tbody tr:first td:visible`).get();
              let $pTD = $(aTDs.shift());

              aTDs.forEach((cTD) => {
                const $cTD = $(cTD);
                if ($cTD.text() === $pTD.text()) {
                  $pTD.attr('colspan', Number($pTD.attr('colspan') || 1) + 1);
                  $cTD.hide();
                } else {
                  $pTD = $cTD;
                }
              });
            },
          },
          oTable
        );
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

      clearTable(oTable) {
        oTable.clearSelection();
        oTable.getBinding().sort(null);
        oTable.getBinding().filter(null);

        const aColumns = oTable.getColumns();

        for (const col of aColumns) {
          col.setSorted(false);
          oTable.filter(col, null);
        }
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
            // 작성
            return sap.ui.core.IndicationColor.None;
          case STATE_APPLY1:
          case STATE_APPLY2:
          case STATE_APPLY3:
          case STATE_IN_PROGRESS3:
            // 신청
            return sap.ui.core.IndicationColor.Indication03;
          case STATE_APPROVE:
          case MED_STATE_COMPLETE:
          case STATE_IN_PLAN:
            // 승인
            return sap.ui.core.IndicationColor.Indication04;
          case STATE_REJECT1:
          case STATE_REJECT2:
          case MED_STATE_REJECT:
            // 반려
            return sap.ui.core.IndicationColor.Indication02;
          case STATE_COMPLETE:
          case STATE_COMPLETE2:
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
          case STATE_IN_PLAN:
            // 계획
            return '계획';
          case STATE_IN_PROGRESS3:
            // 진행중
            return '진행중';
          case STATE_IN_PROGRESS0:
            // 미신청
            return '미신청';
          case STATE_IN_PROGRESS1:
          case STATE_IN_PROGRESS2:
            // 작성
            return '작성';
          case STATE_APPLY1:
          case STATE_APPLY2:
          case STATE_APPLY3:
          case STATE_CSR_APPLY:
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
          case STATE_COMPLETE2:
          case STATE_CSR_COMPLETE:
            // 완료
            return '완료';
          case STATE_CSR_PROGRESS:
            return '처리';
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
