import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Navbar } from './Navbar';

// Mock useAuth hook
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

describe('Navbar', () => {
  const defaultProps = {
    activeTab: 'feed' as const,
    setActiveTab: vi.fn(),
    bookmarkCount: 3,
    sourcesCount: 8,
    onOpenAddModal: vi.fn(),
    onOpenSourcesModal: vi.fn(),
  };

  it('renders brand and hamburger menu button', () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText('OmniFeed')).toBeDefined();
    expect(screen.getByLabelText('Open navigation menu')).toBeDefined();
  });

  it('opens NavDrawer when hamburger menu button is clicked', () => {
    render(<Navbar {...defaultProps} />);
    const menuBtn = screen.getByLabelText('Open navigation menu');
    fireEvent.click(menuBtn);

    // NavDrawer should now be visible in DOM
    expect(screen.getByRole('dialog', { name: 'Navigation drawer' })).toBeDefined();
  });

  it('calls onOpenAddModal when clicking Add Feed', () => {
    const onOpenAddModal = vi.fn();
    render(<Navbar {...defaultProps} onOpenAddModal={onOpenAddModal} />);

    const addBtn = screen.getByText('Add Feed');
    fireEvent.click(addBtn);
    expect(onOpenAddModal).toHaveBeenCalled();
  });

  it('calls onOpenSourcesModal when clicking Manage Sources button', () => {
    const onOpenSourcesModal = vi.fn();
    render(<Navbar {...defaultProps} onOpenSourcesModal={onOpenSourcesModal} />);

    const sourcesBtn = screen.getByTitle('Manage Feed Sources');
    fireEvent.click(sourcesBtn);
    expect(onOpenSourcesModal).toHaveBeenCalled();
  });
});
