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
