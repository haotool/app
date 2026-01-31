/**
 * Animation Token System Test Suite
 *
 * 測試微互動動畫配置
 */

import { describe, it, expect } from 'vitest';
import {
  transitions,
  buttonVariants,
  cardVariants,
  fadeInVariants,
  slideUpVariants,
  scaleInVariants,
  staggerContainerVariants,
  staggerItemVariants,
  segmentedSwitch,
  activeHighlight,
  chartTransitions,
  calculatorKeyVariants,
  microInteractionClasses,
  getMotionProps,
  safeTransition,
} from '../animations';

describe('animations', () => {
  describe('transitions', () => {
    it('should have instant transition for quick feedback', () => {
      expect(transitions.instant).toBeDefined();
      expect(transitions.instant.duration).toBe(0.1);
    });

    it('should have default transition for standard UI', () => {
      expect(transitions.default).toBeDefined();
      expect(transitions.default.duration).toBe(0.2);
    });

    it('should have smooth transition for page changes', () => {
      expect(transitions.smooth).toBeDefined();
      expect(transitions.smooth.duration).toBe(0.3);
    });

    it('should have spring transitions for elastic effects', () => {
      expect(transitions.spring).toBeDefined();
      expect(transitions.spring.type).toBe('spring');
      expect(transitions.gentle).toBeDefined();
      expect(transitions.gentle.type).toBe('spring');
    });
  });

  describe('variants', () => {
    it('should define button variants with scale effects', () => {
      expect(buttonVariants['idle']).toEqual({ scale: 1 });
      expect(buttonVariants['hover']).toEqual({ scale: 1.02 });
      expect(buttonVariants['tap']).toEqual({ scale: 0.98 });
    });

    it('should define card variants with elevation effects', () => {
      expect(cardVariants['idle']).toEqual({ scale: 1, y: 0 });
      expect(cardVariants['hover']).toEqual({ scale: 1.01, y: -2 });
    });

    it('should define fade in variants', () => {
      expect(fadeInVariants['hidden']).toEqual({ opacity: 0 });
      expect(fadeInVariants['visible']).toEqual({ opacity: 1 });
    });

    it('should define slide up variants', () => {
      expect(slideUpVariants['hidden']).toHaveProperty('y', 10);
      expect(slideUpVariants['visible']).toHaveProperty('y', 0);
    });

    it('should define scale in variants', () => {
      expect(scaleInVariants['hidden']).toHaveProperty('scale', 0.95);
      expect(scaleInVariants['visible']).toHaveProperty('scale', 1);
    });

    it('should define stagger variants for list animations', () => {
      expect(staggerContainerVariants['visible']).toHaveProperty('transition');
      expect(staggerItemVariants['hidden']).toHaveProperty('opacity', 0);
    });
  });

  describe('segmentedSwitch', () => {
    it('should use spring transition for indicator', () => {
      expect(segmentedSwitch.indicator).toBe(transitions.spring);
    });

    it('should define active icon scale', () => {
      expect(segmentedSwitch.activeIconScale).toBe(1.1);
    });

    it('should define inactive opacity', () => {
      expect(segmentedSwitch.inactiveOpacity).toBe(0.6);
    });

    it('should define hover and tap micro-interactions', () => {
      expect(segmentedSwitch.item.whileHover).toEqual({ scale: 1.02 });
      expect(segmentedSwitch.item.whileTap).toEqual({ scale: 0.98 });
    });

    it('should define consistent container and indicator classes', () => {
      expect(segmentedSwitch.containerClass).toContain('rounded-[20px]');
      expect(segmentedSwitch.indicatorClass).toContain('rounded-2xl');
      expect(segmentedSwitch.itemBaseClass).toContain('flex-1');
    });
  });

  describe('activeHighlight', () => {
    it('should use gentle spring transition for smooth list sliding', () => {
      expect(activeHighlight.transition).toBe(transitions.gentle);
    });

    it('should define highlight class with ring and background', () => {
      expect(activeHighlight.highlightClass).toContain('ring-2');
      expect(activeHighlight.highlightClass).toContain('bg-primary/10');
      expect(activeHighlight.highlightClass).toContain('rounded-xl');
    });

    it('should define item base class with relative positioning', () => {
      expect(activeHighlight.itemBaseClass).toContain('relative');
      expect(activeHighlight.itemBaseClass).toContain('rounded-xl');
    });

    it('should define active and inactive item classes', () => {
      expect(activeHighlight.itemActiveClass).toContain('cursor-default');
      expect(activeHighlight.itemInactiveClass).toContain('cursor-pointer');
    });
  });

  describe('calculator transitions', () => {
    it('should have iOS-standard feedback transition (150ms)', () => {
      expect(transitions.calculatorFeedback).toBeDefined();
      expect((transitions.calculatorFeedback as { duration: number }).duration).toBe(0.15);
    });

    it('should have keyboard bottom sheet spring', () => {
      expect(transitions.keyboardSheet).toBeDefined();
      expect((transitions.keyboardSheet as { type: string }).type).toBe('spring');
      expect((transitions.keyboardSheet as { stiffness: number }).stiffness).toBe(300);
      expect((transitions.keyboardSheet as { damping: number }).damping).toBe(30);
    });
  });

  describe('calculatorKeyVariants', () => {
    it('should define tap scale larger than idle (reverse of normal buttons)', () => {
      expect(calculatorKeyVariants.tap).toEqual({ scale: 1.1 });
    });

    it('should use standard hover from buttonVariants', () => {
      expect(calculatorKeyVariants.hover).toEqual({ scale: 1.02 });
    });
  });

  describe('chartTransitions', () => {
    it('should have Material Design fade-in curve', () => {
      const fadeIn = chartTransitions.fadeIn as unknown as { duration: number; ease: number[] };
      expect(fadeIn.duration).toBe(0.5);
      expect(fadeIn.ease).toEqual([0.25, 0.1, 0.25, 1]);
    });

    it('should have bouncy tooltip overshoot curve', () => {
      const bounce = chartTransitions.tooltipBounce as unknown as {
        duration: number;
        ease: number[];
      };
      expect(bounce.duration).toBe(0.18);
      expect(bounce.ease).toEqual([0.34, 1.56, 0.64, 1]);
    });
  });

  describe('microInteractionClasses', () => {
    it('should have button interaction classes', () => {
      expect(microInteractionClasses.button).toContain('hover:scale');
      expect(microInteractionClasses.button).toContain('active:scale');
    });

    it('should have card interaction classes', () => {
      expect(microInteractionClasses.card).toContain('hover:shadow');
    });

    it('should have link interaction classes', () => {
      expect(microInteractionClasses.link).toContain('hover:text-primary');
    });

    it('should have nav item interaction classes', () => {
      expect(microInteractionClasses.navItem).toContain('active:scale');
    });
  });

  describe('getMotionProps', () => {
    it('should return empty object when motion is preferred', () => {
      const props = getMotionProps(false);
      expect(props).toEqual({});
    });

    it('should disable animations when reduced motion is preferred', () => {
      const props = getMotionProps(true);
      expect(props.initial).toBe(false);
      expect(props.animate).toBe(false);
      expect(props.transition?.duration).toBe(0);
    });
  });

  describe('safeTransition', () => {
    it('should return original transition when motion is preferred', () => {
      const transition = { duration: 0.3 };
      const result = safeTransition(transition, false);
      expect(result).toEqual(transition);
    });

    it('should return zero duration when reduced motion is preferred', () => {
      const transition = { duration: 0.3 };
      const result = safeTransition(transition, true);
      expect(result.duration).toBe(0);
    });
  });
});
