"use client";

import { useEffect } from "react";

export const ScrollTo = ({
  id,
  parent,
  duration = 600,
}: {
  id: string;
  parent?: string;
  duration?: number;
}) => {
  function scrollToElm(container: HTMLElement, elm: HTMLElement) {
    var pos = getRelativePos(elm);
    scrollTo(container, pos.top, duration / 1000); // duration in seconds
  }

  function getRelativePos(elm: HTMLElement) {
    // @ts-ignore
    var pPos = elm?.parentNode?.getBoundingClientRect(), // parent pos
      cPos = elm.getBoundingClientRect(), // target pos
      pos: any = {};

    // @ts-ignore
    (pos.top = cPos.top - pPos.top + elm?.parentNode?.scrollTop),
      (pos.right = cPos.right - pPos.right),
      (pos.bottom = cPos.bottom - pPos.bottom),
      (pos.left = cPos.left - pPos.left);

    return pos;
  }

  function scrollTo(
    element: HTMLElement,
    to: number,
    duration: number,
    onDone?: () => void,
  ) {
    var start = element.scrollTop,
      change = to - start,
      startTime = performance.now(),
      val,
      now,
      elapsed,
      t;

    function animateScroll() {
      now = performance.now();
      elapsed = (now - startTime) / 1000;
      t = elapsed / duration;

      element.scrollTop = start + change * easeInOutQuad(t);

      if (t < 1) window.requestAnimationFrame(animateScroll);
      else onDone && onDone();
    }

    animateScroll();
  }

  function easeInOutQuad(t: number) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  const scrolltoHash = function (element_id: string, parentId?: string) {
    const parent =
      document.getElementById(parentId || "") || document.documentElement;
    const element = document.getElementById(element_id);

    if (element) {
      scrollToElm(parent, element);
    }
  };

  useEffect(() => {
    scrolltoHash(id, parent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, parent]);
  return null;
};
