// nova-virtual-kit.js - Version 1.0.0 (Aggressively Minimized)

// Simplified Internal Data Store
class list {
  constructor(initialData) {
    this._data = initialData || [];
    this._dirtyIndices = new Set();
    this._subscribers = {
      dataChanged: [],
      itemUpdated: [],
    };
    this._dirtyIndices.add("all");
  }
  _publish(eventType, payload) {
    var subs = this._subscribers[eventType];
    if (subs) {
      for (var i = 0; i < subs.length; i++) {
        subs[i](payload);
      }
    }
  }
  _subscribe(eventType, callback) {
    if (this._subscribers[eventType]) {
      this._subscribers[eventType].push(callback);
    }
  }
  _unsubscribe(eventType, callback) {
    if (this._subscribers[eventType]) {
      this._subscribers[eventType] = this._subscribers[eventType].filter(
        function (cb) {
          return cb !== callback;
        }
      );
    }
  }
  getLength() {
    return this._data.length;
  }
  getItem(index) {
    return this._data[index];
  }
  updateItem(index, newItemData) {
    if (
      index >= 0 &&
      index < this._data.length &&
      this._data[index] !== newItemData
    ) {
      this._data[index] = newItemData;
      this._dirtyIndices.add(index);
      this._publish("itemUpdated", { index: index, newItemData: newItemData });
    }
  }
  addItem(itemData, index) {
    if (index === undefined || index > this._data.length || index < 0) {
      index = this._data.length;
    }
    this._data.splice(index, 0, itemData);
    this._dirtyIndices.add("all");
    this._publish("dataChanged", { type: "add", index: index });
  }
  removeItem(index, count) {
    if (index >= 0 && index < this._data.length && count > 0) {
      this._data.splice(index, count);
      this._dirtyIndices.add("all");
      this._publish("dataChanged", { type: "remove", index: index });
    }
  }
  setData(newData) {
    this._data = newData || [];
    this._dirtyIndices.clear();
    this._dirtyIndices.add("all");
    this._publish("dataChanged", { type: "reset" });
  }
  isDirty(index) {
    if (this._dirtyIndices.has("all")) {
      return true;
    }
    if (this._dirtyIndices.has(index)) {
      this._dirtyIndices.delete(index);
      return true;
    }
    return false;
  }
  clearAllDirty() {
    this._dirtyIndices.clear();
  }
}

// VirtualList component
class VirtualList {
  constructor(containerElement, dataStore, renderItemFunction) {
    this.container = containerElement;
    this.dataStore = dataStore;
    this.renderItem = renderItemFunction;
    this.itemHeightEstimator = null;

    this.domElementsPool = [];
    this.numVisibleSlots = 0;
    this.totalHeight = 0;
    this.currentScrollTop = 0;
    this.startIndex = 0;
    this.scrollAnimationFrame = null;
    this.renderScheduled = false;

    var self = this; // Capture 'this'

    // Init elements
    this.scrollableArea = document.createElement("div");
    this.scrollableArea.style.overflowY = "scroll";
    this.scrollableArea.style.position = "relative";
    this.scrollableArea.style.height = "100%";
    this.container.appendChild(this.scrollableArea);

    this.contentContainer = document.createElement("div");
    this.contentContainer.style.position = "relative";
    this.scrollableArea.appendChild(this.contentContainer);

    // Start Initialization sequence
    this._initMeasureHeight()
      .then(function () {
        // Bind 'this' implicitly via self
        self._postMeasureInit();
      })
      .catch(function (error) {
        console.error("VL Init Error:", error); // Simplified error logging
        self.itemHeightEstimator = 50; // Fallback
        self._postMeasureInit();
      });
  }
  _initMeasureHeight() {
    var self = this;
    return new Promise(function (resolve, reject) {
      if (self.dataStore.getLength() === 0) {
        self.itemHeightEstimator = 50;
        return resolve();
      }

      var tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.visibility = "hidden";
      tempContainer.style.width = "100%";
      document.body.appendChild(tempContainer);

      var firstItemData = self.dataStore.getItem(0);
      var itemElement = self.renderItem(firstItemData, 0);

      if (itemElement instanceof HTMLElement) {
        tempContainer.appendChild(itemElement);
        requestAnimationFrame(function () {
          self.itemHeightEstimator = itemElement.offsetHeight || 50;
          document.body.removeChild(tempContainer);
          resolve();
        });
      } else {
        document.body.removeChild(tempContainer);
        reject(new Error("Render function no HTML element"));
      }
    });
  }
  _postMeasureInit() {
    this.calculateVisibleSlots();
    this.createDOMElementPool();
    this.updateTotalHeight();
    this._attachEventListeners();
    this._subscribeToDataStoreEvents();
    this.scheduleRender();
  }
  calculateVisibleSlots() {
    this.numVisibleSlots =
      Math.ceil(this.container.clientHeight / this.itemHeightEstimator) + 3; // Reduced buffer
  }
  createDOMElementPool() {
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < this.numVisibleSlots; i++) {
      var itemElement = document.createElement("div");
      itemElement.style.position = "absolute";
      itemElement.style.left = "0";
      itemElement.style.width = "100%";
      itemElement.style.boxSizing = "border-box";
      itemElement.classList.add("virtual-item-wrapper");
      itemElement.style.height = this.itemHeightEstimator + "px";

      this.domElementsPool.push(itemElement);
      fragment.appendChild(itemElement);
    }
    this.contentContainer.appendChild(fragment);
  }
  updateTotalHeight() {
    this.totalHeight = this.dataStore.getLength() * this.itemHeightEstimator;
    this.contentContainer.style.height = this.totalHeight + "px";
  }
  _attachEventListeners() {
    this.scrollableArea.addEventListener(
      "scroll",
      this.handleScroll.bind(this)
    );

    var resizeTimeout;
    window.addEventListener(
      "resize",
      function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(this.onResize.bind(this), 100);
      }.bind(this)
    );
  }
  _subscribeToDataStoreEvents() {
    this.dataStore._subscribe("dataChanged", this.handleDataChange.bind(this));
    this.dataStore._subscribe("itemUpdated", this.handleItemUpdate.bind(this));
  }
  handleDataChange() {
    this.updateTotalHeight();
    this.scheduleRender();
  }
  handleItemUpdate() {
    this.scheduleRender();
  }
  handleScroll() {
    var newScrollTop = this.scrollableArea.scrollTop;
    if (newScrollTop === this.currentScrollTop) return;
    this.currentScrollTop = newScrollTop;
    this.scheduleRender();
  }
  onResize() {
    this.calculateVisibleSlots();
    this.scheduleRender();
  }
  scheduleRender() {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    requestAnimationFrame(this.renderVisibleRange.bind(this));
  }
  renderVisibleRange() {
    var newStartIndex = Math.floor(
      this.currentScrollTop / this.itemHeightEstimator
    );
    var maxStartIndex = Math.max(
      0,
      this.dataStore.getLength() - this.numVisibleSlots
    );
    this.startIndex = Math.min(newStartIndex, maxStartIndex);

    this.contentContainer.style.transform =
      "translateY(" + this.startIndex * this.itemHeightEstimator + "px)";

    var needsFullRender = this.dataStore.isDirty("all");

    for (var i = 0; i < this.numVisibleSlots; i++) {
      var dataIndex = this.startIndex + i;
      var itemElementWrapper = this.domElementsPool[i];
      var previousDataIndex = itemElementWrapper.dataset.dataIndex;

      if (
        needsFullRender ||
        previousDataIndex !== String(dataIndex) ||
        this.dataStore.isDirty(dataIndex)
      ) {
        itemElementWrapper.innerHTML = "";

        var dataItem = this.dataStore.getItem(dataIndex);
        if (dataItem !== undefined) {
          var newItemDOM = this.renderItem(dataItem, dataIndex);
          if (newItemDOM instanceof HTMLElement) {
            itemElementWrapper.appendChild(newItemDOM);
          } else {
            itemElementWrapper.textContent = "Render Error";
          }
        } else {
          itemElementWrapper.style.height = "0px";
        }
      }
      itemElementWrapper.dataset.dataIndex = dataIndex;
      itemElementWrapper.style.top = i * this.itemHeightEstimator + "px";
    }

    if (needsFullRender) {
      this.dataStore.clearAllDirty();
    }
    this.renderScheduled = false;
  }
}
