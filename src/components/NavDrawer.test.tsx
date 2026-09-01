import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { NavDrawer } from './NavDrawer';

describe('NavDrawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    activeTab: 'feed' as const,
    setActiveTab: vi.fn(),
    bookmarkCount: 5,
    sourcesCount: 12,
    onOpenAddModal: vi.fn(),
    onOpenSourcesModal: vi.fn(),
  };

  it('renders correctly when open', () => {
    render(<NavDrawer {...defaultProps} />);
    expect(screen.getByText('OmniFeed')).toBeDefined();
    expect(screen.getByText('Live Feed')).toBeDefined();
    expect(screen.getByText('Saved')).toBeDefined();
    expect(screen.getByText('12 streams')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
  });

  it('does not render when closed', () => {
    const { container } = render(<NavDrawer {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls setActiveTab and onClose when clicking Live Feed', () => {
    const setActiveTab = vi.fn();
    const onClose = vi.fn();
    render(<NavDrawer {...defaultProps} setActiveTab={setActiveTab} onClose={onClose} />);

    fireEvent.click(screen.getByText('Live Feed'));
    expect(setActiveTab).toHaveBeenCalledWith('feed');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls setActiveTab and onClose when clicking Saved', () => {
    const setActiveTab = vi.fn();
    const onClose = vi.fn();
    render(<NavDrawer {...defaultProps} setActiveTab={setActiveTab} onClose={onClose} />);

    fireEvent.click(screen.getByText('Saved'));
    expect(setActiveTab).toHaveBeenCalledWith('bookmarks');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onOpenAddModal and onClose when clicking Add Feed', () => {
    const onOpenAddModal = vi.fn();
    const onClose = vi.fn();
    render(<NavDrawer {...defaultProps} onOpenAddModal={onOpenAddModal} onClose={onClose} />);

    fireEvent.click(screen.getByText('Add Custom Feed'));
    expect(onOpenAddModal).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onOpenSourcesModal and onClose when clicking Manage Sources', () => {
    const onOpenSourcesModal = vi.fn();
    const onClose = vi.fn();
    render(<NavDrawer {...defaultProps} onOpenSourcesModal={onOpenSourcesModal} onClose={onClose} />);

    fireEvent.click(screen.getByText('Manage Sources'));
    expect(onOpenSourcesModal).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', () => {
    const onClose = vi.fn();
    render(<NavDrawer {...defaultProps} onClose={onClose} />);

    const backdrop = screen.getByTestId('drawer-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape key press', () => {
    const onClose = vi.fn();
    render(<NavDrawer {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
